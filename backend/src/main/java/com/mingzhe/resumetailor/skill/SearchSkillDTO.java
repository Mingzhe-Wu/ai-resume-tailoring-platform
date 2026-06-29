package com.mingzhe.resumetailor.skill;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body used when searching Skill records.
 */
@Data
public class SearchSkillDTO {

    @NotNull(message = "profileId is required")
    private Long profileId;

    private String name;

    private String category;

}
