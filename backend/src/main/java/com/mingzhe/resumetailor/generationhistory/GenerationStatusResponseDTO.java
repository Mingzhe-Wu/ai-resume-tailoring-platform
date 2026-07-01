package com.mingzhe.resumetailor.generationhistory;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GenerationStatusResponseDTO {
    private GenerationStatus status;
    private String errorMessage;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
