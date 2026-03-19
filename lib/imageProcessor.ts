import * as ImageManipulator from 'expo-image-manipulator';

/**
 * processImage - Compresses and resizes images for Supabase upload
 * @param uri Local URI of the image
 * @returns Compressed image object with new URI
 */
export const processImage = async (uri: string) => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    return result;
  } catch (error) {
    throw error;
  }
};
