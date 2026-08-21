use engine_core::{
    convert_batch_parallel, convert_file, watch_folder, BatchSummary, ConversionOptions,
    ConversionSummary, FolderWatcherHandle,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};

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
