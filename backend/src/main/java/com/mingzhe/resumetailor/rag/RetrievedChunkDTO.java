package com.mingzhe.resumetailor.rag;

import lombok.Data;

@Data
public class RetrievedChunkDTO {

    private Long id;
    private Long userId;
    private EmbeddingSourceType sourceType;
    private Long sourceId;
    private String contentText;
    private Double distance;

}
