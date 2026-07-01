package com.mingzhe.resumetailor.skillkeyword;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SkillKeywordMapper {

    @Select("""
        SELECT
            id,
            term,
            normalized_term AS normalizedTerm,
            category,
            array_to_string(aliases, '||') AS aliasesText,
            array_to_string(role_tags, '||') AS roleTagsText,
            enabled,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM skill_keywords
        WHERE enabled = TRUE
        ORDER BY category ASC, term ASC
        """)
    List<SkillKeyword> findEnabledKeywords();
}
