package com.mingzhe.resumetailor.resume;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ResumeResponseDTO {
    private Long id;
    private Long jobId;
    private Integer matchScore;
    private JsonNode generatedContent;
    private Boolean needGenerate;
    private ResumeGenerationMethod generationMethod;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
