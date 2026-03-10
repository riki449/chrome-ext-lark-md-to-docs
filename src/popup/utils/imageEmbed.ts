/**
 * Fetch all external images in HTML and convert them to inline data URIs.
 * This is needed because Lark's editor can't download external images.
 *
 * Chrome Extension context has no CORS restrictions, so we can fetch anything.
 */
export async function embedExternalImages(
  html: string,
  onProgress?: (current: number, total: number) => void,
): Promise<string> {
  // Find all <img src="..."> tags
  const imgRegex = /<img\s+[^>]*src="(https?:\/\/[^"]+)"[^>]*>/gi;
  const matches = [...html.matchAll(imgRegex)];

  if (matches.length === 0) return html;

  let result = html;
  let done = 0;

  for (const match of matches) {
    const [fullTag, url] = match;
    try {
      onProgress?.(++done, matches.length);

      const response = await fetch(url);
      if (!response.ok) continue;

      const blob = await response.blob();
      const dataUri = await blobToDataUri(blob);

      // Replace only this specific occurrence
      const newTag = fullTag.replace(url, dataUri);
      result = result.replace(fullTag, newTag);
    } catch (err) {
      console.warn(`MD2Lark:: Failed to embed image: ${url}`, err);
      // Keep original URL as fallback
    }
  }

  return result;
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
