package com.mingzhe.resumetailor.job;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body used when searching Job records.
 */
@Data
public class SearchJobDTO {

    @NotNull(message = "userId is required")
    private Long userId;

    private String keyword;

    private Integer status;

}
