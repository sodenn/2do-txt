export function getBaseUrl() {
  if (process.env.REACT_APP_BASE_PATH) {
    return window.location.origin + process.env.REACT_APP_BASE_PATH;
  } else {
    return window.location.origin;
  }
}
