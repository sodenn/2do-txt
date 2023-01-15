use crate::encryption::{decrypt, encrypt};
use kv::*;

fn get_storage(app_handle: &tauri::AppHandle) -> Bucket<String, Vec<u8>> {
    let app_dir = app_handle.path_resolver().app_data_dir().unwrap();
    let storage_path = app_dir.join("user_data").to_string_lossy().to_string();
    let cfg = Config::new(storage_path);
    let store = Store::new(cfg).unwrap();
    store.bucket::<String, Vec<u8>>(Some("secrets")).unwrap()
}

#[tauri::command]
pub fn get_secure_storage_item(key: String, app_handle: tauri::AppHandle) -> Option<String> {
    let storage = get_storage(&app_handle);
    let encrypted = storage.get(&key).unwrap();
    return if encrypted.is_none() {
        None
    } else {
        let val = encrypted.unwrap();
        let decrypted = decrypt(&val);
        Some(decrypted)
    };
}

#[tauri::command]
pub fn set_secure_storage_item(key: String, value: String, app_handle: tauri::AppHandle) -> bool {
    let storage = get_storage(&app_handle);
    let encrypted = encrypt(value.as_bytes());
    match storage.set(&key, &encrypted) {
        Ok(_) => true,
        Err(_) => false,
    }
}

#[tauri::command]
pub fn remove_secure_storage_item(key: String, app_handle: tauri::AppHandle) -> bool {
    let storage = get_storage(&app_handle);
    match storage.remove(&key) {
        Ok(_) => true,
        Err(_) => false,
    }
}
