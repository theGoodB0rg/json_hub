pub mod batch;
pub mod converter;
pub mod error;
pub mod flattener;
pub mod options;
pub mod parser;
pub mod watcher;
pub mod writers;

pub use batch::{convert_batch_parallel, BatchItemResult, BatchSummary};
pub use converter::convert_file;
pub use error::{EngineError, Result};
pub use flattener::{flatten_value, try_unescape_json, FlatRow};
pub use options::{ArrayHandling, ConversionOptions, ConversionSummary, ExportFormat, ProgressUpdate};
pub use parser::JsonStreamReader;
pub use watcher::{watch_folder, FolderWatcherHandle};

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_full_streaming_csv_conversion() {
        let mut input_file = NamedTempFile::new().unwrap();
        let output_file = NamedTempFile::new().unwrap();

        let json_content = r#"[
            {"id": 101, "customer": "Alice", "meta": "{\"source\":\"web\"}"},
            {"id": 102, "customer": "Bob", "meta": "{\"source\":\"mobile\"}"}
        ]"#;

        input_file.write_all(json_content.as_bytes()).unwrap();

        let options = ConversionOptions {
            format: ExportFormat::Csv,
            auto_unescape: true,
            ..Default::default()
        };

        let summary = convert_file(input_file.path(), output_file.path(), &options, None).unwrap();

        assert_eq!(summary.total_records, 2);
        let csv_output = std::fs::read_to_string(output_file.path()).unwrap();
        assert!(csv_output.contains("id"));
        assert!(csv_output.contains("customer"));
        assert!(csv_output.contains("meta.source"));
        assert!(csv_output.contains("web"));
        assert!(csv_output.contains("mobile"));
    }

    #[test]
    fn test_full_streaming_excel_conversion() {
        let mut input_file = NamedTempFile::new().unwrap();
        let output_file = NamedTempFile::new().unwrap();

        let json_content = r#"[
            {"product": "Laptop", "price": 1299.99, "in_stock": true},
            {"product": "Mouse", "price": 25.50, "in_stock": false}
        ]"#;

        input_file.write_all(json_content.as_bytes()).unwrap();

        let options = ConversionOptions {
            format: ExportFormat::Xlsx,
            ..Default::default()
        };

        let summary = convert_file(input_file.path(), output_file.path(), &options, None).unwrap();
        assert_eq!(summary.total_records, 2);
        assert!(output_file.path().exists());
    }
}
