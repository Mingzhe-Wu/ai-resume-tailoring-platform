package com.mingzhe.resumetailor.skillkeyword;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class SkillKeywordService {

    private final SkillKeywordMapper skillKeywordMapper;

    public SkillKeywordService(SkillKeywordMapper skillKeywordMapper) {
        this.skillKeywordMapper = skillKeywordMapper;
    }

    public List<SkillKeywordResponseDTO> findEnabledKeywords() {
        return skillKeywordMapper.findEnabledKeywords()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private SkillKeywordResponseDTO toResponse(SkillKeyword keyword) {
        SkillKeywordResponseDTO response = new SkillKeywordResponseDTO();
        response.setId(keyword.getId());
        response.setTerm(keyword.getTerm());
        response.setNormalizedTerm(keyword.getNormalizedTerm());
        response.setCategory(keyword.getCategory());
        response.setAliases(splitArrayText(keyword.getAliasesText()));
        response.setRoleTags(splitArrayText(keyword.getRoleTagsText()));
        return response;
    }

    private List<String> splitArrayText(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        return Arrays.stream(value.split("\\|\\|"))
                .filter(item -> item != null && !item.isBlank())
                .toList();
    }
}
