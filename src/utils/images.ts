export async function preloadImages(imageUrls: URL[]) {
  const promises = imageUrls.map((url) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => {
        console.error(`Failed to load image: ${url.href}`);
        resolve();
      };
      img.src = url.href;
    });
  });
  await Promise.all(promises);
}
