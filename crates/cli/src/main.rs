use clap::{Parser, ValueEnum};
use engine_core::{
    convert_batch_parallel, convert_file, watch_folder, ArrayHandling, ConversionOptions,
    ExportFormat,
};
use indicatif::{ProgressBar, ProgressStyle};
use std::path::PathBuf;
use std::sync::Arc;

#[derive(ValueEnum, Clone, Copy, Debug)]
enum CliFormat {
    Csv,
    Xlsx,
    Jsonl,
}

impl From<CliFormat> for ExportFormat {
    fn from(f: CliFormat) -> Self {
        match f {
            CliFormat::Csv => ExportFormat::Csv,
            CliFormat::Xlsx => ExportFormat::Xlsx,
            CliFormat::Jsonl => ExportFormat::Jsonl,
        }
    }
}

#[derive(Parser, Debug)]
#[command(name = "jsonexport")]
#[command(about = "High-performance streaming JSON to Excel/CSV converter & automation tool", version = "0.1.0")]
struct Cli {
    /// Path to input JSON file or folder
    #[arg(required = true)]
    input: PathBuf,

    /// Destination output file or folder
    #[arg(short, long)]
    output: Option<PathBuf>,

    /// Target export format (csv, xlsx, jsonl)
    #[arg(short, long, default_value = "csv")]
    format: CliFormat,

    /// CSV column delimiter
    #[arg(short, long, default_value = ",")]
    delimiter: char,

    /// Disable auto-unescaping of stringified JSON fields
    #[arg(long)]
    no_unescape: bool,

    /// Run in continuous folder watch mode
    #[arg(short, long)]
    watch: bool,
}

fn main() -> anyhow::Result<()> {
    let args = Cli::parse();

    let options = ConversionOptions {
        format: args.format.into(),
        delimiter: args.delimiter,
        auto_unescape: !args.no_unescape,
        array_handling: ArrayHandling::Join,
        ..Default::default()
    };

    if args.watch {
        let watch_dir = &args.input;
        let out_dir = args.output.unwrap_or_else(|| watch_dir.clone());
        println!("🚀 Watching folder: {}", watch_dir.display());
        println!("📂 Output directory: {}", out_dir.display());

        let _handle = watch_folder(
            watch_dir,
            out_dir,
            options,
            Some(Arc::new(|src, dst| {
                println!("✨ Converted: {} -> {}", src.display(), dst.display());
            })),
        ).map_err(|e| anyhow::anyhow!("{}", e))?;

        println!("Press Ctrl+C to exit.");
        loop {
            std::thread::sleep(std::time::Duration::from_secs(1));
        }
    }

    if args.input.is_dir() {
        // Batch convert directory
        let out_dir = args.output.unwrap_or_else(|| args.input.clone());
        let entries: Vec<PathBuf> = std::fs::read_dir(&args.input)?
            .filter_map(|e| e.ok())
            .map(|e| e.path())
            .filter(|p| p.extension().and_then(|e| e.to_str()) == Some("json"))
            .collect();

        if entries.is_empty() {
            println!("No .json files found in {}", args.input.display());
            return Ok(());
        }

        let pb = ProgressBar::new(entries.len() as u64);
        pb.set_style(
            ProgressStyle::default_bar()
                .template("[{elapsed_precise}] {bar:40.cyan/blue} {pos}/{len} files ({eta})")
                .unwrap(),
        );

        let pb_clone = pb.clone();
        let summary = convert_batch_parallel(
            &entries,
            &out_dir,
            &options,
            Some(Arc::new(move |_curr, _tot| {
                pb_clone.inc(1);
            })),
        )?;

        pb.finish_with_message("Done!");
        println!(
            "✅ Batch complete: {} succeeded, {} failed in {}ms",
            summary.succeeded, summary.failed, summary.elapsed_millis
        );
    } else {
        // Single file conversion
        let ext = match options.format {
            ExportFormat::Csv => "csv",
            ExportFormat::Xlsx => "xlsx",
            ExportFormat::Jsonl => "jsonl",
            ExportFormat::Json => "json",
        };

        let output_path = args.output.unwrap_or_else(|| {
            let mut p = args.input.clone();
            p.set_extension(ext);
            p
        });

        println!("⚡ Converting {} -> {}...", args.input.display(), output_path.display());
        let summary = convert_file(&args.input, &output_path, &options, None)?;

        println!(
            "✅ Done! {} records, {} columns in {}ms",
            summary.total_records, summary.total_columns, summary.elapsed_millis
        );
    }

    Ok(())
}
