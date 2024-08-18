export async function canShare(data: ShareData) {
  return navigator.canShare(data);
}

export async function share(data: ShareData) {
  await navigator.share(data);
}
