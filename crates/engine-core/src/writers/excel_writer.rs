use crate::error::Result;
use crate::flattener::FlatRow;
use crate::options::ConversionOptions;
use rust_xlsxwriter::{Format, FormatBorder, Workbook};
use std::collections::HashMap;
use std::path::Path;

pub struct StreamingExcelWriter {
    workbook: Workbook,
    sheet_name: String,
    headers: Vec<String>,
    header_indices: HashMap<String, usize>,
    buffered_rows: Vec<FlatRow>,
}

impl StreamingExcelWriter {
    pub fn new(options: &ConversionOptions) -> Self {
        let workbook = Workbook::new();
        Self {
            workbook,
            sheet_name: options.excel_sheet_name.clone(),
            headers: Vec::new(),
            header_indices: HashMap::new(),
            buffered_rows: Vec::new(),
        }
    }

    pub fn write_row(&mut self, row: FlatRow) -> Result<()> {
        for (k, _) in &row {
            if !self.header_indices.contains_key(k) {
                let idx = self.headers.len();
                self.headers.push(k.clone());
                self.header_indices.insert(k.clone(), idx);
            }
        }

        self.buffered_rows.push(row);
        Ok(())
    }

    pub fn save_to_file<P: AsRef<Path>>(&mut self, path: P) -> Result<usize> {
        let worksheet = self.workbook.add_worksheet();
        worksheet.set_name(&self.sheet_name).ok();

        let header_format = Format::new()
            .set_bold()
            .set_border_bottom(FormatBorder::Medium);

        // Write headers at row 0
        for (col_idx, header) in self.headers.iter().enumerate() {
            worksheet.write_string_with_format(0, col_idx as u16, header, &header_format)?;
        }

        let mut row_idx: u32 = 1;
        for row in &self.buffered_rows {
            let mut row_map = HashMap::with_capacity(row.len());
            for (k, v) in row {
                row_map.insert(k.as_str(), v.as_str());
            }

            for (col_idx, header) in self.headers.iter().enumerate() {
                if let Some(val_str) = row_map.get(header.as_str()) {
                    if val_str.is_empty() {
                        continue;
                    }
                    // Try parsing as number
                    if let Ok(num) = val_str.parse::<f64>() {
                        worksheet.write_number(row_idx, col_idx as u16, num)?;
                    } else if let Ok(b) = val_str.parse::<bool>() {
                        worksheet.write_boolean(row_idx, col_idx as u16, b)?;
                    } else {
                        worksheet.write_string(row_idx, col_idx as u16, *val_str)?;
                    }
                }
            }
            row_idx += 1;
        }

        worksheet.autofit();
        self.workbook.save(path)?;
        Ok(self.headers.len())
    }
}
