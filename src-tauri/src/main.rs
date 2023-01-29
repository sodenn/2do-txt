#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use oauth::oauth;
use secure_storage::{
    get_secure_storage_item, remove_secure_storage_item, set_secure_storage_item,
};
use splashscreen::close_splashscreen;

mod encryption;
mod oauth;
mod secure_storage;
mod splashscreen;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            oauth,
            close_splashscreen,
            get_secure_storage_item,
            set_secure_storage_item,
            remove_secure_storage_item,
            close_splashscreen
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
