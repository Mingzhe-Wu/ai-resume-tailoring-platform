package com.mingzhe.resumetailor.job;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Request body used when creating Job records.
 */
@Data
public class CreateJobDTO {

    @NotNull(message = "userId is required")
    private Long userId;

    @NotBlank(message = "title is required")
    private String title;

    @NotBlank(message = "company is required")
    private String company;

    private String jobDescription;

    private String sourceUrl;

    private Integer status;

    private LocalDateTime interviewTime;

}
