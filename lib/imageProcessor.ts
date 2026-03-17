import * as ImageManipulator from 'expo-image-manipulator';

/**
 * processImage - Compresses and resizes images for Supabase upload
 * @param uri Local URI of the image
 * @returns Compressed image object with new URI
 */
export const processImage = async (uri: string) => {
  try {
    console.log('🖼️ IMAGE_PROCESSOR: Starting compression for:', uri);
    
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    console.log('✅ IMAGE_PROCESSOR: Compression complete. New URI:', result.uri);
    return result;
  } catch (error) {
    console.error('❌ IMAGE_PROCESSOR: Error processing image:', error);
    throw error;
  }
};
