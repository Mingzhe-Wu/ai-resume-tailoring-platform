package com.mingzhe.resumetailor.project;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents Project data in the application.
 */
@Data
public class Project {

    private Long id;

    private Long profileId;

    private String projectName;

    private String techStack;

    private LocalDate startDate;

    private LocalDate endDate;

    private String description;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}
