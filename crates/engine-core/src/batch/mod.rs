use crate::converter::convert_file;
use crate::error::Result;
use crate::options::{ConversionOptions, ConversionSummary, ExportFormat};
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchItemResult {
    pub input_path: String,
    pub output_path: String,
    pub success: bool,
    pub error: Option<String>,
    pub summary: Option<ConversionSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchSummary {
    pub total_files: usize,
    pub succeeded: usize,
    pub failed: usize,
    pub items: Vec<BatchItemResult>,
    pub elapsed_millis: u128,
}

pub fn convert_batch_parallel<P: AsRef<Path> + Sync, Q: AsRef<Path> + Sync>(
    input_files: &[P],
    output_dir: Q,
    options: &ConversionOptions,
    on_item_completed: Option<Arc<dyn Fn(usize, usize) + Send + Sync>>,
) -> Result<BatchSummary> {
    let start_time = std::time::Instant::now();
    let total_files = input_files.len();
    let completed_counter = Arc::new(AtomicUsize::new(0));

    let ext = match options.format {
        ExportFormat::Csv => "csv",
        ExportFormat::Xlsx => "xlsx",
        ExportFormat::Jsonl => "jsonl",
        ExportFormat::Json => "json",
    };

    let results: Vec<BatchItemResult> = input_files
        .par_iter()
        .map(|input_ref| {
            let input_path = input_ref.as_ref();
            let file_stem = input_path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("output");

            let output_path = output_dir
                .as_ref()
                .join(format!("{}.{}", file_stem, ext));

            let res = convert_file(input_path, &output_path, options, None);

            let (success, error, summary) = match res {
                Ok(sum) => (true, None, Some(sum)),
                Err(err) => (false, Some(err.to_string()), None),
            };

            let current = completed_counter.fetch_add(1, Ordering::SeqCst) + 1;
            if let Some(ref cb) = on_item_completed {
                cb(current, total_files);
            }

            BatchItemResult {
                input_path: input_path.to_string_lossy().to_string(),
                output_path: output_path.to_string_lossy().to_string(),
                success,
                error,
                summary,
            }
        })
        .collect();

    let succeeded = results.iter().filter(|r| r.success).count();
    let failed = results.len() - succeeded;

    Ok(BatchSummary {
        total_files,
        succeeded,
        failed,
        items: results,
        elapsed_millis: start_time.elapsed().as_millis(),
    })
}
