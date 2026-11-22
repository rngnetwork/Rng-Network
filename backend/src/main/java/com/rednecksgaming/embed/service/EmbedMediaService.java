// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.service;

import com.rednecksgaming.embed.dto.EmbedMediaResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface EmbedMediaService {

    EmbedMediaResponse storeMedia(MultipartFile file);
    Resource loadMediaAsResource(String filename);
    String resolveContentType(String filename);
}
