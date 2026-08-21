use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExportFormat {
    Csv,
    Xlsx,
    Jsonl,
    Json,
}

impl Default for ExportFormat {
    fn default() -> Self {
        Self::Csv
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ArrayHandling {
    /// Join array elements with delimiter (e.g. "item1, item2")
    Join,
    /// Expand into indexed keys (e.g. items.0, items.1)
    Expand,
    /// Keep as raw JSON string (e.g. "[1, 2, 3]")
    Stringify,
}

impl Default for ArrayHandling {
    fn default() -> Self {
        Self::Join
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionOptions {
    pub format: ExportFormat,
    pub delimiter: char,
    pub key_separator: String,
    pub array_handling: ArrayHandling,
    pub auto_unescape: bool,
    pub max_depth: usize,
    pub include_headers: bool,
    pub excel_sheet_name: String,
}

impl Default for ConversionOptions {
    fn default() -> Self {
        Self {
            format: ExportFormat::Csv,
            delimiter: ',',
            key_separator: ".".to_string(),
            array_handling: ArrayHandling::Join,
            auto_unescape: true,
            max_depth: 10,
            include_headers: true,
            excel_sheet_name: "Export".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressUpdate {
    pub processed_records: usize,
    pub processed_bytes: u64,
    pub total_bytes: u64,
    pub percent: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionSummary {
    pub total_records: usize,
    pub total_columns: usize,
    pub total_bytes_read: u64,
    pub elapsed_millis: u128,
}
