// Improved hash function for better uniqueness
export const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0"); // Convert to two-digit hex
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Improved hash function for better uniqueness
export const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0; // Ensures 32-bit integer result
  }
  return hash;
};

// Generate a unique color using HSL based on a string input
export const hashToColor = (str: string): string => {
  // Get a robust hash value from the string
  const hash = hashCode(str);

  // Use the hash to determine hue (0 - 360 degrees) with better spread by multiplying the hash value
  const hue = (Math.abs(hash) * 137) % 360;

  // Set saturation and lightness to fixed values to ensure vivid colors
  const saturation = 70; // Saturation as a percentage (70%)
  const lightness = 50; // Lightness as a percentage (50%)

  // Generate and return the hex color from HSL values
  const color = hslToHex(hue, saturation, lightness);

  return color;
};
