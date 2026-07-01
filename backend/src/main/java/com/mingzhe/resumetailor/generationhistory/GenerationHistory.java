package com.mingzhe.resumetailor.generationhistory;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class GenerationHistory {
    private Long id;
    private Long userId;
    private Long jobId;
    private Long resumeVersionId;
    private GenerationMethod generationMethod;
    private Long promptTemplateId;
    private String modelName;
    private GenerationStatus status;
    private String errorMessage;
    private Integer inputTokenCount;
    private Integer outputTokenCount;
    private BigDecimal estimatedCostUsd;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
