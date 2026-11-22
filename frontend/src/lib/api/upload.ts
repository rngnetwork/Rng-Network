import { httpClient } from './core/client';
import { ApiResponse } from './core/types';

export interface EmbedMediaResponse {
  url: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

/**
 * Uploads an image file to the RNG Control Center self-hosted media storage endpoint.
 *
 * @param file The image File selected from the client's device
 * @returns Direct public URL of the uploaded media asset
 */
export async function uploadImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file must be an image (PNG, JPEG, GIF, WEBP).');
  }

  const formData = new FormData();
  formData.append('file', file);

  const res: ApiResponse<EmbedMediaResponse> = await httpClient.post<EmbedMediaResponse>(
    '/embeds/media/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  if (res.success && res.data?.url) {
    return res.data.url;
  }

  throw new Error(res.message || 'Image upload failed. Please try again.');
}
