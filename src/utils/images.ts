export async function preloadImages(imageUrls: URL[]) {
  const promises = imageUrls.map((url) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url.href;
    });
  });
  await Promise.all(promises);
}
