/*
 * Prevent 'Blocked aria-hidden' warning by closing the menu before opening
 * the confirmation dialog.
 */
export function safeOpenDialog(callback: () => void) {
  setTimeout(() => {
    callback();
  }, 200);
}
