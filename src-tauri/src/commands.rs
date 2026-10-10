use engine_core::{
    convert_batch_parallel, convert_file, watch_folder, BatchSummary, ConversionOptions,
    ConversionSummary, FolderWatcherHandle,
};
use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager, State};

/// Hard cap on `write_bytes_to_path` payload size. 2 GiB is already past
/// anything an in-browser JSON parser could produce (user hits "unable to
/// allocate" long before this) but is a durable guardrail against a bug
/// that would try to materialise an impossibly large blob and OOM the box.
const MAX_WRITE_BYTES: usize = 2 * 1024 * 1024 * 1024;

/// Sanitise an absolute path for log output. Keeps only the final path
/// component (the filename), replacing the rest with `[...]`. We never
/// write full user paths to the log — the point of the log is actionable
/// breadcrumbs, not a trail of where someone keeps their files.
fn log_safe_path(path: &str) -> String {
    Path::new(path)
        .file_name()
        .and_then(|n| n.to_str())
        .map(|n| format!("[...]/{}", n))
        .unwrap_or_else(|| "[...]/".to_string())
}

pub struct AppState {
    pub watchers: Mutex<HashMap<String, FolderWatcherHandle>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            watchers: Mutex::new(HashMap::new()),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DesktopInfo {
    pub is_desktop: bool,
    pub os: String,
    pub rust_engine_version: String,
    pub streaming_supported: bool,
}

#[tauri::command]
pub fn get_desktop_info() -> DesktopInfo {
    DesktopInfo {
        is_desktop: true,
        os: std::env::consts::OS.to_string(),
        rust_engine_version: "0.1.0".to_string(),
        streaming_supported: true,
    }
}

#[tauri::command]
pub async fn convert_file_streaming(
    app: AppHandle,
    input_path: String,
    output_path: String,
    options: ConversionOptions,
) -> Result<ConversionSummary, String> {
    let app_handle = app.clone();
    tokio::task::spawn_blocking(move || {
        convert_file(
            &input_path,
            &output_path,
            &options,
            Some(Box::new(move |progress| {
                let _ = app_handle.emit("conversion_progress", &progress);
            })),
        )
        .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn batch_convert_files(
    app: AppHandle,
    input_files: Vec<String>,
    output_dir: String,
    options: ConversionOptions,
) -> Result<BatchSummary, String> {
    let app_handle = app.clone();
    tokio::task::spawn_blocking(move || {
        let paths: Vec<PathBuf> = input_files.into_iter().map(PathBuf::from).collect();
        let app_cb = Arc::new(move |current: usize, total: usize| {
            #[derive(Serialize)]
            struct BatchProgress {
                current: usize,
                total: usize,
            }
            let _ = app_handle.emit("batch_progress", &BatchProgress { current, total });
        });

        convert_batch_parallel(&paths, &output_dir, &options, Some(app_cb))
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn start_folder_watcher(
    app: AppHandle,
    state: State<'_, AppState>,
    watcher_id: String,
    watch_dir: String,
    output_dir: String,
    options: ConversionOptions,
) -> Result<bool, String> {
    let app_handle = app.clone();
    let id_for_cb = watcher_id.clone();

    let handle = watch_folder(
        &watch_dir,
        &output_dir,
        options,
        Some(Arc::new(move |src, dst| {
            #[derive(Serialize)]
            struct WatcherEvent {
                watcher_id: String,
                source_file: String,
                output_file: String,
            }
            let _ = app_handle.emit(
                "folder_watcher_event",
                &WatcherEvent {
                    watcher_id: id_for_cb.clone(),
                    source_file: src.to_string_lossy().to_string(),
                    output_file: dst.to_string_lossy().to_string(),
                },
            );
        })),
    )
    .map_err(|e| e.to_string())?;

    let mut watchers = state.watchers.lock().map_err(|e| e.to_string())?;
    watchers.insert(watcher_id, handle);

    Ok(true)
}

#[tauri::command]
pub fn stop_folder_watcher(
    state: State<'_, AppState>,
    watcher_id: String,
) -> Result<bool, String> {
    let mut watchers = state.watchers.lock().map_err(|e| e.to_string())?;
    if let Some(handle) = watchers.remove(&watcher_id) {
        handle.stop();
        Ok(true)
    } else {
        Err(format!("Watcher with ID {} not found", watcher_id))
    }
}

#[tauri::command]
pub fn open_external_url(url: String) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("cmd")
            .args(["/C", "start", "", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(true);
    }
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(true);
    }
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(true);
    }
    #[allow(unreachable_code)]
    Ok(false)
}

/// Write a buffer of bytes to an absolute path chosen by the user via the
/// Save As dialog. We keep writes constrained to a Tauri command (not the
/// fs plugin) because the only legitimate call-site is the download helper
/// right after the dialog returns — no need to grant broad filesystem
/// capabilities to the whole webview.
///
/// Guardrails:
///   - path must be non-empty
///   - parent directory must exist (we don't silently create — surprising)
///   - bytes capped at MAX_WRITE_BYTES
/// All error messages are user-facing, so they say what to do, not what
/// went wrong internally. Log breadcrumbs (basename only) go to the
/// rotating log file for post-hoc debugging — never the full path.
#[tauri::command]
pub fn write_bytes_to_path(path: String, bytes: Vec<u8>) -> Result<(), String> {
    write_bytes_impl(path, bytes)
}

// Split from the #[command] wrapper so unit tests can call it directly
// without needing a Tauri app handle.
pub(crate) fn write_bytes_impl(path: String, bytes: Vec<u8>) -> Result<(), String> {
    if path.trim().is_empty() {
        warn!("write_bytes rejected: empty path");
        return Err("Save failed: no destination was selected.".to_string());
    }
    if bytes.len() > MAX_WRITE_BYTES {
        warn!(
            "write_bytes rejected: size {} exceeds cap {}",
            bytes.len(),
            MAX_WRITE_BYTES
        );
        return Err(format!(
            "Save failed: file is {} MB, which is above the {} MB in-memory cap. Use the desktop app's streaming converter for files this large.",
            bytes.len() / (1024 * 1024),
            MAX_WRITE_BYTES / (1024 * 1024)
        ));
    }
    let target = Path::new(&path);
    match target.parent() {
        Some(parent) if !parent.as_os_str().is_empty() && !parent.exists() => {
            warn!(
                "write_bytes rejected: parent dir missing for {}",
                log_safe_path(&path)
            );
            return Err(
                "Save failed: the folder you chose no longer exists. Pick a different location."
                    .to_string(),
            );
        }
        _ => {}
    }

    info!(
        "write_bytes: {} ({} bytes)",
        log_safe_path(&path),
        bytes.len()
    );
    match std::fs::write(&path, &bytes) {
        Ok(()) => {
            info!("write_bytes ok: {}", log_safe_path(&path));
            Ok(())
        }
        Err(e) => {
            warn!("write_bytes failed: {} — {}", log_safe_path(&path), e);
            Err(format!("Save failed: {}", e))
        }
    }
}

/// Read the tail of the local log file so a user can view it in the
/// in-app /debug view without leaving the sandbox. Returns the last ~500
/// lines by default to keep the payload modest; capped at 2000.
///
/// SECURITY NOTE: this reads a local file written by this process to the
/// Tauri app-data dir. The log never contains user data (we sanitise all
/// paths down to the basename and never write JSON payloads) so a user
/// pasting their log to us leaks only app state. No network side-effect.
#[tauri::command]
pub fn read_recent_logs(app: AppHandle, max_lines: Option<usize>) -> Result<String, String> {
    let want = max_lines.unwrap_or(500).min(2000);
    let dir = app.path().app_log_dir().map_err(|e| e.to_string())?;
    let log_path = dir.join("jsonexport.log");
    if !log_path.exists() {
        return Ok(format!(
            "(No log file yet at {}. Open the app, trigger the action again, then re-open this view.)",
            log_path.display()
        ));
    }
    let contents =
        std::fs::read_to_string(&log_path).map_err(|e| format!("read log: {}", e))?;
    // Tail-read: split and take the last `want` lines.
    let lines: Vec<&str> = contents.lines().collect();
    let start = lines.len().saturating_sub(want);
    Ok(lines[start..].join("\n"))
}

#[cfg(test)]
mod write_bytes_tests {
    use super::*;
    use std::fs;

    fn tmp_file(name: &str) -> PathBuf {
        let mut dir = std::env::temp_dir();
        dir.push(format!("jsonexport-test-{}-{}", std::process::id(), name));
        dir
    }

    #[test]
    fn happy_path_writes_bytes_and_returns_ok() {
        let path = tmp_file("happy.csv");
        let bytes = b"hello,world\n1,2\n".to_vec();
        assert!(write_bytes_impl(path.to_string_lossy().into_owned(), bytes.clone()).is_ok());
        assert_eq!(fs::read(&path).unwrap(), bytes);
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn empty_path_is_rejected_with_user_facing_error() {
        let err = write_bytes_impl(String::new(), vec![1, 2, 3]).unwrap_err();
        assert!(err.to_lowercase().contains("destination"), "got: {}", err);
    }

    #[test]
    fn whitespace_only_path_is_rejected() {
        let err = write_bytes_impl("   ".to_string(), vec![1, 2, 3]).unwrap_err();
        assert!(err.to_lowercase().contains("destination"), "got: {}", err);
    }

    #[test]
    fn missing_parent_dir_returns_user_facing_error() {
        let path = std::env::temp_dir()
            .join("jsonexport-no-such-dir-xyz-123")
            .join("out.csv");
        let err = write_bytes_impl(path.to_string_lossy().into_owned(), vec![0u8]).unwrap_err();
        assert!(err.to_lowercase().contains("folder"), "got: {}", err);
    }

    #[test]
    fn unicode_filename_writes_correctly() {
        let path = tmp_file("テスト-αβγ.csv");
        let bytes = b"ok".to_vec();
        assert!(write_bytes_impl(path.to_string_lossy().into_owned(), bytes).is_ok());
        assert!(path.exists());
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn empty_bytes_still_writes_a_zero_byte_file() {
        let path = tmp_file("empty.csv");
        assert!(write_bytes_impl(path.to_string_lossy().into_owned(), vec![]).is_ok());
        assert_eq!(fs::metadata(&path).unwrap().len(), 0);
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn oversize_bytes_rejected_without_touching_disk() {
        // Build a path we expect NOT to be created
        let path = tmp_file("too-big.csv");
        let _ = fs::remove_file(&path); // make sure it isn't lying around

        // Can't actually allocate 2GB in a unit test — fake it by making the
        // check path testable. We'll call with a `MAX_WRITE_BYTES + 1`-length
        // Vec via with_capacity; the Vec itself is empty but len() check
        // runs before any write, so this exercises the guard without alloc.
        //
        // In practice `vec![0u8; MAX_WRITE_BYTES + 1]` would OOM the CI,
        // so we take advantage of the fact that write_bytes_impl inspects
        // bytes.len() first and short-circuits. This is intentional: the
        // test asserts the guardrail, not Rust's allocator.
        let mut bytes = Vec::new();
        unsafe {
            // SAFETY: we only ever call .len() on this vec, never read it.
            // Setting len past capacity is UB if we touched the buffer;
            // write_bytes_impl's early-return avoids any access.
            bytes.set_len(MAX_WRITE_BYTES + 1);
        }
        let err = write_bytes_impl(path.to_string_lossy().into_owned(), bytes).unwrap_err();
        assert!(err.to_lowercase().contains("cap"), "got: {}", err);
        assert!(!path.exists(), "write guardrail should not create a file");
    }

    #[test]
    fn overwrites_existing_file_in_place() {
        let path = tmp_file("overwrite.csv");
        fs::write(&path, b"old content").unwrap();
        write_bytes_impl(path.to_string_lossy().into_owned(), b"new".to_vec()).unwrap();
        assert_eq!(fs::read(&path).unwrap(), b"new");
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn log_safe_path_strips_everything_but_basename() {
        assert_eq!(log_safe_path("C:\\Users\\Alice\\secret.csv"), "[...]/secret.csv");
        assert_eq!(log_safe_path("/home/alice/docs/report.xlsx"), "[...]/report.xlsx");
        assert_eq!(log_safe_path("plain.csv"), "[...]/plain.csv");
    }
}

