use crate::error::{EngineError, Result};
use crate::flattener::flatten_value;
use crate::options::{ConversionOptions, ConversionSummary, ExportFormat, ProgressUpdate};
use crate::parser::JsonStreamReader;
use crate::writers::{StreamingCsvWriter, StreamingExcelWriter, StreamingJsonlWriter};
use std::fs::File;
use std::io::{BufReader, BufWriter};
use std::path::Path;
use std::time::Instant;

pub type ProgressCallback = Box<dyn Fn(ProgressUpdate) + Send + Sync>;

pub fn convert_file<P: AsRef<Path>, Q: AsRef<Path>>(
    input_path: P,
    output_path: Q,
    options: &ConversionOptions,
    progress_callback: Option<ProgressCallback>,
) -> Result<ConversionSummary> {
    let start_time = Instant::now();
    let file = File::open(input_path.as_ref())?;
    let total_bytes = file.metadata()?.len();

    let reader = BufReader::with_capacity(64 * 1024, file);
    let mut stream_reader = JsonStreamReader::new(reader)?;

    let mut record_count = 0;
    let mut total_cols = 0;

    match options.format {
        ExportFormat::Csv => {
            let out_file = File::create(output_path.as_ref())?;
            let out_writer = BufWriter::with_capacity(64 * 1024, out_file);
            let mut csv_writer = StreamingCsvWriter::new(out_writer, options);

            while let Some(val) = stream_reader.next_value()? {
                let flat_row = flatten_value(&val, options);
                csv_writer.write_row(flat_row)?;
                record_count += 1;

                if let Some(ref cb) = progress_callback {
                    if record_count % 1000 == 0 {
                        cb(ProgressUpdate {
                            processed_records: record_count,
                            processed_bytes: 0,
                            total_bytes,
                            percent: 0.0,
                        });
                    }
                }
            }
            total_cols = csv_writer.finish()?;
        }
        ExportFormat::Xlsx => {
            let mut excel_writer = StreamingExcelWriter::new(options);

            while let Some(val) = stream_reader.next_value()? {
                let flat_row = flatten_value(&val, options);
                excel_writer.write_row(flat_row)?;
                record_count += 1;

                if let Some(ref cb) = progress_callback {
                    if record_count % 1000 == 0 {
                        cb(ProgressUpdate {
                            processed_records: record_count,
                            processed_bytes: 0,
                            total_bytes,
                            percent: 0.0,
                        });
                    }
                }
            }
            total_cols = excel_writer.save_to_file(output_path.as_ref())?;
        }
        ExportFormat::Jsonl => {
            let out_file = File::create(output_path.as_ref())?;
            let out_writer = BufWriter::with_capacity(64 * 1024, out_file);
            let mut jsonl_writer = StreamingJsonlWriter::new(out_writer);

            while let Some(val) = stream_reader.next_value()? {
                let flat_row = flatten_value(&val, options);
                jsonl_writer.write_row(flat_row)?;
                record_count += 1;
            }
            jsonl_writer.finish()?;
        }
        ExportFormat::Json => {
            return Err(EngineError::InvalidInput("Direct JSON to JSON copy not required; use format conversion".to_string()));
        }
    }

    let elapsed = start_time.elapsed().as_millis();
    if let Some(ref cb) = progress_callback {
        cb(ProgressUpdate {
            processed_records: record_count,
            processed_bytes: total_bytes,
            total_bytes,
            percent: 100.0,
        });
    }

    Ok(ConversionSummary {
        total_records: record_count,
        total_columns: total_cols,
        total_bytes_read: total_bytes,
        elapsed_millis: elapsed,
    })
}
