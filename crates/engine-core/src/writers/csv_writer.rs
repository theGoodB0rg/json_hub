use crate::error::Result;
use crate::flattener::FlatRow;
use crate::options::ConversionOptions;
use csv::Writer;
use std::collections::HashMap;
use std::io::Write;

pub struct StreamingCsvWriter<W: Write> {
    writer: Writer<W>,
    headers: Vec<String>,
    header_indices: HashMap<String, usize>,
    headers_written: bool,
    buffered_rows: Vec<FlatRow>,
    sample_size: usize,
}

impl<W: Write> StreamingCsvWriter<W> {
    pub fn new(target: W, options: &ConversionOptions) -> Self {
        let writer = csv::WriterBuilder::new()
            .delimiter(options.delimiter as u8)
            .from_writer(target);

        Self {
            writer,
            headers: Vec::new(),
            header_indices: HashMap::new(),
            headers_written: false,
            buffered_rows: Vec::new(),
            sample_size: 50, // Sample first 50 rows to discover unified header schema
        }
    }

    pub fn write_row(&mut self, row: FlatRow) -> Result<()> {
        // Collect new headers discovered in this row
        for (k, _) in &row {
            if !self.header_indices.contains_key(k) {
                let idx = self.headers.len();
                self.headers.push(k.clone());
                self.header_indices.insert(k.clone(), idx);
            }
        }

        if !self.headers_written {
            self.buffered_rows.push(row);
            if self.buffered_rows.len() >= self.sample_size {
                self.flush_headers_and_buffered()?;
            }
        } else {
            self.write_single_row(&row)?;
        }

        Ok(())
    }

    pub fn finish(&mut self) -> Result<usize> {
        if !self.headers_written {
            self.flush_headers_and_buffered()?;
        }
        self.writer.flush()?;
        Ok(self.headers.len())
    }

    fn flush_headers_and_buffered(&mut self) -> Result<()> {
        // Write header row
        self.writer.write_record(&self.headers)?;
        self.headers_written = true;

        let rows = std::mem::take(&mut self.buffered_rows);
        for row in &rows {
            self.write_single_row(row)?;
        }
        Ok(())
    }

    fn write_single_row(&mut self, row: &FlatRow) -> Result<()> {
        let mut row_map = HashMap::with_capacity(row.len());
        for (k, v) in row {
            row_map.insert(k.as_str(), v.as_str());
        }

        let mut record = Vec::with_capacity(self.headers.len());
        for header in &self.headers {
            let val = row_map.get(header.as_str()).unwrap_or(&"");
            record.push(*val);
        }

        self.writer.write_record(&record)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_streaming_csv_writer() {
        let buffer = Vec::new();
        let opts = ConversionOptions::default();
        let mut writer = StreamingCsvWriter::new(buffer, &opts);

        let row1 = vec![("id".to_string(), "1".to_string()), ("name".to_string(), "Alice".to_string())];
        let row2 = vec![("id".to_string(), "2".to_string()), ("city".to_string(), "Paris".to_string())];

        writer.write_row(row1).unwrap();
        writer.write_row(row2).unwrap();
        let cols = writer.finish().unwrap();

        assert_eq!(cols, 3); // id, name, city
    }
}
