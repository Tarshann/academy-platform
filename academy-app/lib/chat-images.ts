import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// DM image message prefix — used to detect image messages in DM content
export const DM_IMAGE_PREFIX = '[image]';

export interface ImageUploadResult {
  url: string;
  key: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export type ImageSource = 'camera' | 'library';

/**
 * Request camera/library permissions and pick an image.
 * Returns the picked asset or null if cancelled/denied.
 */
export async function pickImage(
  source: ImageSource
): Promise<ImagePicker.ImagePickerAsset | null> {
  // Request permission
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }
  }

  const launchFn =
    source === 'camera'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

  const result = await launchFn({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  return result.assets[0];
}

/**
 * Validate image file size. Returns an error message or null if valid.
 */
export function validateImageSize(fileSize: number | undefined): string | null {
  if (!fileSize) return null; // Can't validate without size info
  if (fileSize > MAX_FILE_SIZE) {
    const sizeMB = (fileSize / (1024 * 1024)).toFixed(1);
    return `Image is too large (${sizeMB}MB). Maximum size is 5MB.`;
  }
  return null;
}

/**
 * Upload an image to the chat upload endpoint.
 * Returns the uploaded image URL or throws on failure.
 */
export async function uploadChatImage(
  uri: string,
  token: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<ImageUploadResult> {
  const formData = new FormData();

  // Extract filename and type from URI
  const uriParts = uri.split('/');
  const fileName = uriParts[uriParts.length - 1] || 'photo.jpg';
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

  // Append file to form data
  formData.append('file', {
    uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
    name: fileName,
    type: mimeType,
  } as any);

  formData.append('token', token);

  // Use XMLHttpRequest for progress tracking
  return new Promise<ImageUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percent: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          resolve(response as ImageUploadResult);
        } catch {
          reject(new Error('Invalid server response'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timed out'));
    });

    xhr.timeout = 60000; // 60 second timeout
    xhr.open('POST', `${API_URL}/api/chat/upload-image`);
    xhr.send(formData);
  });
}

/**
 * Check if a DM message content is an image message.
 */
export function isDmImageMessage(content: string): boolean {
  return content.startsWith(DM_IMAGE_PREFIX);
}

/**
 * Extract the image URL from a DM image message.
 */
export function extractDmImageUrl(content: string): string {
  return content.slice(DM_IMAGE_PREFIX.length);
}

/**
 * Create a DM image message content string.
 */
export function createDmImageContent(imageUrl: string): string {
  return `${DM_IMAGE_PREFIX}${imageUrl}`;
}
