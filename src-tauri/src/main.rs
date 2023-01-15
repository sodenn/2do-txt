#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Manager;

use secure_storage::{
    get_secure_storage_item, remove_secure_storage_item, set_secure_storage_item,
};

mod encryption;
mod secure_storage;

// This command must be async so that it doesn't run on the main thread.
#[tauri::command]
async fn close_splashscreen(window: tauri::Window) {
    // Close splashscreen
    if let Some(splashscreen) = window.get_window("splashscreen") {
        splashscreen.close().unwrap();
    }
    // Show main window
    window.get_window("main").unwrap().show().unwrap();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            close_splashscreen,
            get_secure_storage_item,
            set_secure_storage_item,
            remove_secure_storage_item
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
