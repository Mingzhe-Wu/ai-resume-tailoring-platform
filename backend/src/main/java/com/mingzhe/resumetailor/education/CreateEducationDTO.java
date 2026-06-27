package com.mingzhe.resumetailor.education;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request body used when creating Education records.
 */
@Data
public class CreateEducationDTO {

    @NotNull(message = "profileId is required")
    private Long profileId;

    @NotBlank(message = "schoolName is required")
    private String schoolName;

    private String degree;

    private String major;

    private LocalDate startDate;

    private LocalDate endDate;

    private BigDecimal gpa;

    private String relevantCoursework;

    private String description;

}
