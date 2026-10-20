import { httpClient, withTokenConfig } from '../../../core/client';
import type { ApiResponse } from '../../../core/types';
import type { ServerDetail } from '../../../../model/server';

export async function fetchServerDetails(
  accessToken?: string,
  idOrSlug?: string
): Promise<ApiResponse<ServerDetail>> {
  const targetId = idOrSlug !== undefined ? idOrSlug : accessToken || '';
  const effectiveToken = idOrSlug !== undefined ? accessToken : undefined;
  return httpClient.get<ServerDetail>(
    `/servers/${encodeURIComponent(targetId)}`,
    withTokenConfig(effectiveToken)
  );
}
