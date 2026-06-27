package com.mingzhe.resumetailor.skill;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Represents Skill data in the application.
 */
@Data
public class Skill {

    private Long id;

    private Long profileId;

    private String category;

    private String name;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}
