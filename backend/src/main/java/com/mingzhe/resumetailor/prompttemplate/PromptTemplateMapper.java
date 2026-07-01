package com.mingzhe.resumetailor.prompttemplate;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface PromptTemplateMapper {
    @Select("""
        SELECT
            id,
            name,
            type,
            version,
            content,
            active,
            created_at AS createdAt,
            updated_at AS updatedAt,
            user_id AS userId
        FROM prompt_templates
        WHERE type = #{type}
          AND active = TRUE
          AND user_id IS NULL
        LIMIT 1
        """)
    PromptTemplate findActiveByType(@Param("type") String type);

    @Select("""
        SELECT
            id,
            name,
            type,
            version,
            content,
            active,
            created_at AS createdAt,
            updated_at AS updatedAt,
            user_id AS userId
        FROM prompt_templates
        WHERE user_id = #{userId}
          AND type = #{type}
          AND active = TRUE
        LIMIT 1
        """)
    PromptTemplate findUserPromptByType(
            @Param("userId") Long userId,
            @Param("type") String type
    );

    @Select("""
        SELECT
            id,
            name,
            type,
            version,
            content,
            active,
            created_at AS createdAt,
            updated_at AS updatedAt,
            user_id AS userId
        FROM prompt_templates
        WHERE user_id IS NULL
          AND type = #{type}
          AND active = TRUE
        LIMIT 1
        """)
    PromptTemplate findDefaultPromptByType(@Param("type") String type);

    @Select("""
        SELECT
            id,
            name,
            type,
            version,
            content,
            active,
            created_at AS createdAt,
            updated_at AS updatedAt,
            user_id AS userId
        FROM prompt_templates
        WHERE type = #{type}
          AND active = TRUE
          AND (user_id = #{userId} OR user_id IS NULL)
        ORDER BY CASE WHEN user_id = #{userId} THEN 0 ELSE 1 END
        LIMIT 1
        """)
    PromptTemplate findEffectivePromptByType(
            @Param("userId") Long userId,
            @Param("type") String type
    );

    @Insert("""
        INSERT INTO prompt_templates (
            name,
            type,
            version,
            content,
            active,
            user_id
        ) VALUES (
            #{name},
            #{type},
            #{version},
            #{content},
            #{active},
            #{userId}
        )
        """)
    int insertUserPrompt(PromptTemplate promptTemplate);

    @Update("""
        UPDATE prompt_templates
        SET
            name = #{name},
            content = #{content},
            active = TRUE,
            version = 1,
            updated_at = NOW()
        WHERE user_id = #{userId}
          AND type = #{type}
        """)
    int updateUserPrompt(PromptTemplate promptTemplate);

    @Delete("""
        DELETE FROM prompt_templates
        WHERE user_id = #{userId}
          AND type = #{type}
        """)
    int deleteUserPrompt(
            @Param("userId") Long userId,
            @Param("type") String type
    );
}
