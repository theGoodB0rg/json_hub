use crate::converter::convert_file;
use crate::options::ConversionOptions;
use notify::{Config, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::{Path, PathBuf};
use std::sync::mpsc::{channel, Sender};
use std::sync::Arc;
use std::thread;

pub struct FolderWatcherHandle {
    _watcher: RecommendedWatcher,
    stop_tx: Sender<()>,
}

impl FolderWatcherHandle {
    pub fn stop(self) {
        let _ = self.stop_tx.send(());
    }
}

pub fn watch_folder<P: AsRef<Path>, Q: AsRef<Path>>(
    watch_dir: P,
    output_dir: Q,
    options: ConversionOptions,
    on_file_converted: Option<Arc<dyn Fn(PathBuf, PathBuf) + Send + Sync + 'static>>,
) -> Result<FolderWatcherHandle, Box<dyn std::error::Error + Send + Sync>> {
    let watch_path = watch_dir.as_ref().to_path_buf();
    let out_path = output_dir.as_ref().to_path_buf();

    let (event_tx, event_rx) = channel();
    let (stop_tx, stop_rx) = channel();

    let mut watcher = RecommendedWatcher::new(
        move |res| {
            if let Ok(event) = res {
                let _ = event_tx.send(event);
            }
        },
        Config::default(),
    )?;

    watcher.watch(&watch_path, RecursiveMode::NonRecursive)?;

    let watcher_options = options.clone();
    thread::spawn(move || {
        loop {
            // Check stop signal
            if stop_rx.try_recv().is_ok() {
                break;
            }

            if let Ok(event) = event_rx.recv_timeout(std::time::Duration::from_millis(500)) {
                if let EventKind::Create(_) | EventKind::Modify(_) = event.kind {
                    for path in event.paths {
                        if path.extension().and_then(|e| e.to_str()) == Some("json") {
                            // Give OS a tiny delay for file writing to complete
                            thread::sleep(std::time::Duration::from_millis(200));

                            let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("output");
                            let ext = match watcher_options.format {
                                crate::options::ExportFormat::Csv => "csv",
                                crate::options::ExportFormat::Xlsx => "xlsx",
                                crate::options::ExportFormat::Jsonl => "jsonl",
                                crate::options::ExportFormat::Json => "json",
                            };
                            let target_file = out_path.join(format!("{}.{}", stem, ext));

                            if convert_file(&path, &target_file, &watcher_options, None).is_ok() {
                                if let Some(ref cb) = on_file_converted {
                                    cb(path, target_file);
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    Ok(FolderWatcherHandle {
        _watcher: watcher,
        stop_tx,
    })
}
