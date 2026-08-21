use thiserror::Error;

#[derive(Error, Debug)]
pub enum EngineError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("CSV error: {0}")]
    Csv(#[from] csv::Error),

    #[error("Excel generation error: {0}")]
    Excel(#[from] rust_xlsxwriter::XlsxError),

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Conversion cancelled")]
    Cancelled,
}

pub type Result<T> = std::result::Result<T, EngineError>;
