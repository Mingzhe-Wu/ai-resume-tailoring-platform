package com.mingzhe.resumetailor.skillkeyword;

import lombok.Data;

import java.util.List;

@Data
public class SkillKeywordResponseDTO {
    private Long id;
    private String term;
    private String normalizedTerm;
    private String category;
    private List<String> aliases;
    private List<String> roleTags;
}
