# Debugging the JsonExport Desktop App

Local-only debug protocol for the Tauri desktop app. Nothing here touches
the network — the log lives on your disk, in your own user profile, and
the only person who sees it is you (and whoever you choose to paste it to).

## TL;DR for users

1. Open the desktop app
2. Reproduce the bug
3. Navigate to the **Debug log viewer** at `/debug` (type it in the address
   bar inside the app, or open the dev menu and paste `window.location.href = '/debug'`)
4. Click **Copy**
5. Paste the result into your bug report

The log never contains your JSON input, your license key, or your email.
It only contains timestamps, severities, and the *basename* of files you
saved — e.g. `[…]/report.csv`, never the folder path.

## Where the log file lives on disk

The desktop app writes a rotating log file to the platform-standard
app-data directory. If you'd rather open it in a text editor than use the
in-app viewer:

| OS      | Path                                                                          |
| ------- | ----------------------------------------------------------------------------- |
| Windows | `%APPDATA%\com.jsonexport.app\logs\jsonexport.log`                            |
| macOS   | `~/Library/Logs/com.jsonexport.app/jsonexport.log`                            |
| Linux   | `~/.local/share/com.jsonexport.app/logs/jsonexport.log` (XDG_DATA_HOME aware) |

The file is capped at **5 MB** per file, and we keep one rotated copy, so
the entire log footprint is bounded to ~10 MB on disk.

## What goes in the log

- **Timestamps + severity + component name.** Everything funnels through
  Rust's `log` crate behind `tauri-plugin-log`.
- **Save operation outcomes.** Success, failure, size written, basename of
  the destination. Example: `[INFO] write_bytes: [...]/report.csv (12345 bytes)`.
- **Updater polls.** Which version we checked for, which we got back, whether
  an update was installed.
- **Rust command errors.** Streaming conversion failures, folder-watch
  stops, dialog cancellations.

## What is explicitly NOT in the log

- Your JSON input or exported file content.
- Full absolute paths — only basenames (we strip everything up to the last
  separator via `log_safe_path` in `src-tauri/src/commands.rs`).
- License keys, Gumroad data, email addresses, any auth material.
- IP, device ID, machine name.

The sanitisation is a hard code-level invariant, not a config toggle.

## For contributors — adding log calls

- Use `log::{debug, info, warn, error}` in Rust, never `println!`.
- **Never** pass a user-controlled string (full path, filename as entered,
  JSON content, URL with query) into a log statement without running it
  through `log_safe_path` or an explicit allow-list.
- `info!` for successful operations, `warn!` for recoverable issues,
  `error!` only for hard failures (the kind that would also surface to the
  user as a toast). Debug level is dev-only.
- When adding a new Tauri command that touches the filesystem or an
  external process, also add it to the Rust test module next to
  `write_bytes_tests` in `src-tauri/src/commands.rs`. Follow the pattern:
  one happy-path test + one guardrail test per failure mode.

## For contributors — adding tests

Two layers:

1. **Rust** — unit tests live in-crate (`#[cfg(test)] mod … tests { … }`)
   so they run under `cargo test` without needing a Tauri app handle.
   Prefer calling the inner `*_impl` function directly so the test
   doesn't require Tauri at all.

2. **TypeScript** — the Jest suite covers everything that runs in the
   webview. Platform helpers that branch on `isTauriRuntime()` should
   have at least one web-path test and one guarded Tauri-path test.
   For a touched helper, add the real-world dangerous input to the
   corresponding `*.test.ts` file as a named case — this is the
   institutional memory that stops the same bug landing twice.

## Security model

The attack surface we care about:

- **Local file disclosure** via the log — mitigated by never writing full
  paths or user data.
- **Arbitrary file write** via `write_bytes_to_path` — mitigated by requiring
  the path come from a user-chosen Save dialog return (the webview can't
  construct arbitrary paths at runtime without going through the dialog),
  by capping bytes at 2 GiB, and by requiring the parent directory to
  already exist.
- **Clipboard exfiltration** via /debug — the "Copy" button only ever
  writes to the viewer's own clipboard with the viewer's gesture; nothing
  reads it back.
- **Network egress** — the debug surface has none. The log viewer is a
  pure read of a local file via a Rust command; no fetch, no telemetry.

If any of those invariants ever changes, update this document in the same
commit.
