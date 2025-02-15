/**
 * Extracts image URLs from FireCrawl metadata by combining both regular image and OpenGraph image fields.
 * @param {any} metadata - The metadata object from FireCrawl containing potential image information
 * @param {string[]} [metadata.image] - Optional array of regular image URLs
 * @param {string} [metadata.ogImage] - Optional OpenGraph image URL
 * @returns {string[] | undefined} An array of image URLs if any images are found, undefined otherwise
 */
export function getImagesFromFireCrawlMetadata(
  metadata: any,
): string[] | undefined {
  const image = metadata.image || [];
  const ogImage = metadata.ogImage ? [metadata.ogImage] : [];
  if (image?.length || ogImage?.length) {
    return [...ogImage, ...image];
  }
  return undefined;
}
