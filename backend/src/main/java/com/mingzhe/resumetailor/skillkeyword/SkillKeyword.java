package com.mingzhe.resumetailor.skillkeyword;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SkillKeyword {
    private Long id;
    private String term;
    private String normalizedTerm;
    private String category;
    private String aliasesText;
    private String roleTagsText;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
