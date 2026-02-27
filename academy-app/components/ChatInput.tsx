import { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  pickImage,
  validateImageSize,
  type ImageSource,
  type UploadProgress,
} from '../lib/chat-images';

const ACADEMY_GOLD = '#CFB87C';
const NAVY = '#1a1a2e';

interface ChatInputProps {
  onSend: (message: string) => void;
  onImageSend?: (uri: string, source: ImageSource) => void;
  disabled?: boolean;
  placeholder?: string;
  uploadProgress?: UploadProgress | null;
  isUploading?: boolean;
}

export function ChatInput({
  onSend,
  onImageSend,
  disabled,
  placeholder,
  uploadProgress,
  isUploading,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<ImageSource>('library');

  const handleSend = () => {
    if (previewUri && onImageSend) {
      onImageSend(previewUri, previewSource);
      setPreviewUri(null);
      return;
    }
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handlePickImage = useCallback(
    async (source: ImageSource) => {
      const asset = await pickImage(source);
      if (!asset) return;

      // Validate file size
      const sizeError = validateImageSize(asset.fileSize);
      if (sizeError) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Image Too Large', sizeError);
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPreviewUri(asset.uri);
      setPreviewSource(source);
    },
    []
  );

  const showImageOptions = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Send Image', 'Choose a source', [
      { text: 'Camera', onPress: () => handlePickImage('camera') },
      { text: 'Photo Library', onPress: () => handlePickImage('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [handlePickImage]);

  const clearPreview = () => {
    setPreviewUri(null);
  };

  const isBusy = disabled || isUploading;
  const canSend = previewUri ? !isBusy : text.trim().length > 0 && !isBusy;

  return (
    <View style={styles.outerContainer}>
      {/* Image preview */}
      {previewUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: previewUri }} style={styles.previewImage} contentFit="cover" />
          {isUploading && uploadProgress ? (
            <View style={styles.progressOverlay}>
              <View style={[styles.progressBar, { width: `${uploadProgress.percent}%` }]} />
              <Text style={styles.progressText}>{uploadProgress.percent}%</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.previewCloseButton}
              onPress={clearPreview}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Input row */}
      <View style={styles.container}>
        {/* Image picker button */}
        {onImageSend && !previewUri && (
          <TouchableOpacity
            style={styles.imageButton}
            onPress={showImageOptions}
            disabled={isBusy}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="image-outline" size={24} color={isBusy ? '#ccc' : ACADEMY_GOLD} />
          </TouchableOpacity>
        )}

        {!previewUri && (
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={placeholder || 'Type a message...'}
            placeholderTextColor="#999"
            multiline
            maxLength={5000}
            editable={!isBusy}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
        )}

        {previewUri && !isUploading && (
          <View style={styles.captionArea}>
            <Text style={styles.captionHint}>Tap send to share this image</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e8e8ed',
    backgroundColor: '#fff',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  imageButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#f8f8f8',
    color: '#1a1a2e',
  },
  captionArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  captionHint: {
    fontSize: 14,
    color: '#888',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACADEMY_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  previewContainer: {
    margin: 12,
    marginBottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e8e8ed',
  },
  previewImage: {
    width: '100%',
    height: 180,
  },
  previewCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: ACADEMY_GOLD,
    opacity: 0.7,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
