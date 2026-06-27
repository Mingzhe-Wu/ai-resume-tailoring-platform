package com.mingzhe.resumetailor.experience;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents Experience data in the application.
 */
@Data
public class Experience {

    private Long id;

    private Long profileId;

    private String companyName;

    private String position;

    private String location;

    private LocalDate startDate;

    private LocalDate endDate;

    private String description;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}
