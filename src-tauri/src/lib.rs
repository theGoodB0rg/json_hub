mod commands;

use commands::AppState;
use tauri_plugin_log::{Target, TargetKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        // Logging is enabled in release builds too so users on installed
        // binaries can actually hand us log breadcrumbs when something
        // breaks. The log file lives in the platform-standard app-data
        // directory (never on the network, never auto-collected) and is
        // size-capped so it can't grow unbounded. Debug builds also
        // mirror to stdout. See DEBUGGING_DESKTOP.md for the location
        // per OS and the sanitisation protocol.
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::LogDir {
                        file_name: Some("jsonexport".to_string()),
                    }),
                    #[cfg(debug_assertions)]
                    Target::new(TargetKind::Stdout),
                ])
                .level(if cfg!(debug_assertions) {
                    log::LevelFilter::Debug
                } else {
                    log::LevelFilter::Info
                })
                .max_file_size(5_000_000) // 5 MB per file
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepOne)
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_desktop_info,
            commands::convert_file_streaming,
            commands::batch_convert_files,
            commands::start_folder_watcher,
            commands::stop_folder_watcher,
            commands::open_external_url,
            commands::write_bytes_to_path,
            commands::read_recent_logs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
