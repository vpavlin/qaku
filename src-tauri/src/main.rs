// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::async_runtime;
use tauri::Manager;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

fn main() {
    let child = Arc::new(Mutex::new(None));
    let child_setup = Arc::clone(&child);
    let child_event = Arc::clone(&child);
      tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let home_dir = app.path().home_dir().unwrap();
            
            
            async_runtime::spawn(async move {
                let app_handle = handle;

                // Create the data directory if it doesn't exist
                let data_dir = format!("{}/.codex/data", home_dir.to_string_lossy());
                std::fs::create_dir_all(&data_dir).expect("Failed to create data directory");
                
                // Start Codex first (e.g., with flags for local mode)
                let (mut rx, mut _codex) = app_handle.shell().sidecar("codex").unwrap()
                    .arg("--bootstrap-node=spr:CiUIAhIhAzCS_gDDbbohfuomYsvRChdG6z0LT-N_kkACoImmgLaVEgIDARpJCicAJQgCEiEDMJL-AMNtuiF-6iZiy9EKF0brPQtP43-SQAKgiaaAtpUQip7mxQYaCwoJBICMN4CRAh-aGgsKCQSAjDeAkQIfmipHMEUCIQD4WbtOTNAkocZSvvZJhtQnncXvZUdtH7JYjRnw_eCZywIgaZU14lI9D7Lou6IxsLNB6iVzXRYvtEd0QKWSwM0p2cs")
                    .arg("--log-level=DEBUG")
                    .arg("--api-cors-origin=*")
                    .arg(&format!("--data-dir={}", data_dir))
                    .arg("--api-port=3213")
                    .arg("--api-bindaddr=0.0.0.0")   // Bind to all interfaces
                    .spawn()
                    .expect("Failed to start Codex");

                      // Store child in mutex
                {
                    let mut child_guard = child_setup.lock().unwrap();
                    *child_guard = Some(_codex);
                    println!("Codex sidecar started: {}", child_guard.as_ref().unwrap().pid());

                }

                let mut bootstrapped = false;
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stdout(line_bytes) = event {
                        let line = String::from_utf8_lossy(&line_bytes);
                        
                        println!("{}", line);
                    
                        
                        if line.contains("Bootstrapped 100%") {
                            bootstrapped = true;
                            // Wait a bit for hostname file to be written
                            thread::sleep(Duration::from_secs(5));
                            break;
                        }
                    }
                }


            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_codex_port])
        .on_window_event(move |window, event| {
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    api.prevent_close();
                    println!("Window close requested, stopping sidecars...");

                    let mut child_guard = child_event.lock().unwrap();
                    if let Some(c) = child_guard.take() {
                        if let Err(e) = c.kill() {
                            eprintln!("Failed to kill Codex process: {}", e);
                        }
                    }

                    window.app_handle().exit(0);
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_codex_port() -> u16 {
    3213 // Must match the port in the sidecar arguments
}
