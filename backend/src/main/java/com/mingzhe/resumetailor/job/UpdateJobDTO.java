package com.mingzhe.resumetailor.job;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Request body used when updating Job records.
 */
@Data
public class UpdateJobDTO {

    private String title;

    private String company;

    private String jobDescription;

    private String sourceUrl;

    private Integer status;

    private LocalDateTime interviewTime;

}
