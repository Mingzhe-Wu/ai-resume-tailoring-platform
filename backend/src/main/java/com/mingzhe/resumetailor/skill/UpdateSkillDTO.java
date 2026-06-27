package com.mingzhe.resumetailor.skill;

import lombok.Data;

/**
 * Request body used when updating Skill records.
 */
@Data
public class UpdateSkillDTO {

    private String category;

    private String name;

}
