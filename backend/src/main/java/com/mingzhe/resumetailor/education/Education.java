package com.mingzhe.resumetailor.education;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents Education data in the application.
 */
@Data
public class Education {

    private Long id;

    private Long profileId;

    private String schoolName;

    private String degree;

    private String major;

    private LocalDate startDate;

    private LocalDate endDate;

    private BigDecimal gpa;

    private String relevantCoursework;

    private String description;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}
