import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';


const API_URL = process.env.EXPO_PUBLIC_API_URL;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

// DM image message prefix — used to detect image messages in DM content
export const DM_IMAGE_PREFIX = '[image]';
export const DM_VIDEO_PREFIX = '[video]';

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
export type MediaType = 'image' | 'video';

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
 * Request permissions and pick a video.
 * Returns the picked asset or null if cancelled/denied.
 */
export async function pickVideo(
  source: ImageSource
): Promise<ImagePicker.ImagePickerAsset | null> {
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;
  }

  const launchFn =
    source === 'camera'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

  const result = await launchFn({
    mediaTypes: ['videos'],
    allowsEditing: true,
    videoMaxDuration: 60, // 60 second max
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.[0]) return null;
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
 * Validate video file size. Returns an error message or null if valid.
 */
export function validateVideoSize(fileSize: number | undefined): string | null {
  if (!fileSize) return null;
  if (fileSize > MAX_VIDEO_SIZE) {
    const sizeMB = (fileSize / (1024 * 1024)).toFixed(1);
    return `Video is too large (${sizeMB}MB). Maximum size is 50MB.`;
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

  // Append file to form data (keep full file:// URI for RN 0.81+)
  formData.append('file', {
    uri,
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
 * Upload a video to the chat upload endpoint.
 * Returns the uploaded video URL or throws on failure.
 */
export async function uploadChatVideo(
  uri: string,
  token: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<ImageUploadResult> {
  const formData = new FormData();

  const uriParts = uri.split('/');
  const fileName = uriParts[uriParts.length - 1] || 'video.mp4';
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'mp4';
  const mimeType = `video/${fileExtension === 'mov' ? 'quicktime' : fileExtension}`;

  formData.append('file', {
    uri,
    name: fileName,
    type: mimeType,
  } as any);

  formData.append('token', token);
  formData.append('mediaType', 'video');

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

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('timeout', () => reject(new Error('Upload timed out')));

    xhr.timeout = 120000; // 2 minute timeout for video
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
 * Check if a DM message content is a video message.
 */
export function isDmVideoMessage(content: string): boolean {
  return content.startsWith(DM_VIDEO_PREFIX);
}

/**
 * Extract the image URL from a DM image message.
 */
export function extractDmImageUrl(content: string): string {
  return content.slice(DM_IMAGE_PREFIX.length);
}

/**
 * Extract the video URL from a DM video message.
 */
export function extractDmVideoUrl(content: string): string {
  return content.slice(DM_VIDEO_PREFIX.length);
}

/**
 * Create a DM image message content string.
 */
export function createDmImageContent(imageUrl: string): string {
  return `${DM_IMAGE_PREFIX}${imageUrl}`;
}

/**
 * Create a DM video message content string.
 */
export function createDmVideoContent(videoUrl: string): string {
  return `${DM_VIDEO_PREFIX}${videoUrl}`;
}

/**
 * Detect media type from a URI
 */
export function detectMediaType(uri: string): MediaType {
  const ext = uri.split('.').pop()?.toLowerCase() ?? '';
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];
  return videoExtensions.includes(ext) ? 'video' : 'image';
}
