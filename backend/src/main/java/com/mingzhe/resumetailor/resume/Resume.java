package com.mingzhe.resumetailor.resume;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Represents Resume data in the application.
 */
@Data
public class Resume {

    private Long id;

    private Long jobId;

    private Integer matchScore;

    private String generatedContent;

    private Boolean needGenerate;

    private ResumeGenerationMethod generationMethod;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}
