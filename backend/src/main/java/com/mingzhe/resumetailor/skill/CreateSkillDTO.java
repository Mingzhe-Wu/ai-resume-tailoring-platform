package com.mingzhe.resumetailor.skill;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body used when creating Skill records.
 */
@Data
public class CreateSkillDTO {

    @NotNull(message = "profileId is required")
    private Long profileId;

    private String category;

    @NotBlank(message = "name is required")
    private String name;

}
