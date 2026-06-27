package com.mingzhe.resumetailor.project;

import lombok.Data;

import java.time.LocalDate;

/**
 * Request body used when updating Project records.
 */
@Data
public class UpdateProjectDTO {

    private String projectName;

    private String techStack;

    private LocalDate startDate;

    private LocalDate endDate;

    private String description;

}
