#[tauri::command]
pub async fn oauth(auth_url: String, redirect_url: String, app_handle: tauri::AppHandle) -> String {
    let (tx, rx) = std::sync::mpsc::channel::<String>();
    let _window = tauri::WindowBuilder::new(
        &app_handle,
        "external",
        tauri::WindowUrl::External(auth_url.parse().unwrap()),
    )
    .on_navigation(move |url| {
        let str = url.as_str();
        if str.starts_with(&redirect_url) {
            tx.send(url.query().unwrap().to_string()).unwrap();
            return false;
        }
        true
    })
    .build()
    .unwrap();
    let query_string = rx.recv().unwrap();
    _window.close().unwrap();
    query_string
}
