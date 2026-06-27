package com.mingzhe.resumetailor.experience;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * Request body used when creating Experience records.
 */
@Data
public class CreateExperienceDTO {

    @NotNull(message = "profileId is required")
    private Long profileId;

    @NotBlank(message = "companyName is required")
    private String companyName;

    @NotBlank(message = "position is required")
    private String position;

    private String location;

    @NotNull(message = "startDate is required")
    private LocalDate startDate;

    private LocalDate endDate;

    private String description;

}
