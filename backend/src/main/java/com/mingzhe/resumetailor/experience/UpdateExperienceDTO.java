package com.mingzhe.resumetailor.experience;

import lombok.Data;

import java.time.LocalDate;

/**
 * Request body used when updating Experience records.
 */
@Data
public class UpdateExperienceDTO {

    private String companyName;

    private String position;

    private String location;

    private LocalDate startDate;

    private LocalDate endDate;

    private String description;

}
