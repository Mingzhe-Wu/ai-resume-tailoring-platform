package com.mingzhe.resumetailor.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * Request body used when creating Project records.
 */
@Data
public class CreateProjectDTO {

    @NotNull(message = "profileId is required")
    private Long profileId;

    @NotBlank(message = "projectName is required")
    private String projectName;

    private String techStack;

    private LocalDate startDate;

    private LocalDate endDate;

    private String description;

}
