use crate::encryption::{decrypt, encrypt};
use kv::*;

fn get_storage(app_handle: &tauri::AppHandle) -> Result<Bucket<String, Vec<u8>>, Error> {
    let app_dir = app_handle.path_resolver().app_data_dir().unwrap();
    let storage_path = app_dir.join("user_data").to_string_lossy().to_string();
    let cfg = Config::new(storage_path);
    let store = Store::new(cfg).map_err(|err| err)?;
    store.bucket::<String, Vec<u8>>(Some("secrets"))
}

#[tauri::command]
pub fn get_secure_storage_item(
    key: String,
    app_handle: tauri::AppHandle,
) -> Result<Option<String>, String> {
    let storage = get_storage(&app_handle).map_err(|err| err.to_string())?;
    let encrypted = storage.get(&key).map_err(|err| err.to_string())?;
    match encrypted {
        None => Ok(None),
        Some(value) => match decrypt(&value) {
            Ok(decrypted) => Ok(Some(decrypted)),
            Err(err) => Err(err.to_string()),
        },
    }
}

#[tauri::command]
pub fn set_secure_storage_item(
    key: String,
    value: String,
    app_handle: tauri::AppHandle,
) -> Result<bool, bool> {
    let storage = match get_storage(&app_handle) {
        Ok(storage) => storage,
        Err(_) => return Ok(false),
    };
    let encrypted = match encrypt(value.as_bytes()) {
        Ok(encrypted) => encrypted,
        Err(_) => return Ok(false),
    };
    match storage.set(&key, &encrypted) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub fn remove_secure_storage_item(key: String, app_handle: tauri::AppHandle) -> Result<bool, bool> {
    let storage = match get_storage(&app_handle) {
        Ok(storage) => storage,
        Err(_) => return Ok(false),
    };
    match storage.remove(&key) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}
