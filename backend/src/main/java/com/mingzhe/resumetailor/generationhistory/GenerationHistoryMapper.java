package com.mingzhe.resumetailor.generationhistory;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface GenerationHistoryMapper {

    @Insert("""
        INSERT INTO generation_history (
            user_id,
            job_id,
            resume_version_id,
            generation_method,
            prompt_template_id,
            model_name,
            status,
            error_message,
            input_token_count,
            output_token_count,
            estimated_cost_usd,
            started_at,
            completed_at
        ) VALUES (
            #{userId},
            #{jobId},
            #{resumeVersionId},
            #{generationMethod},
            #{promptTemplateId},
            #{modelName},
            #{status},
            #{errorMessage},
            #{inputTokenCount},
            #{outputTokenCount},
            #{estimatedCostUsd},
            #{startedAt},
            #{completedAt}
        )
        """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(GenerationHistory generationHistory);

    @Update("""
        UPDATE generation_history
        SET status = #{status},
            resume_version_id = #{resumeVersionId},
            prompt_template_id = #{promptTemplateId},
            error_message = #{errorMessage},
            input_token_count = #{inputTokenCount},
            output_token_count = #{outputTokenCount},
            estimated_cost_usd = #{estimatedCostUsd},
            completed_at = CURRENT_TIMESTAMP
        WHERE id = #{id}
        """)
    int updateCompletion(GenerationHistory generationHistory);

    @Select("""
        SELECT
            id,
            user_id AS userId,
            job_id AS jobId,
            resume_version_id AS resumeVersionId,
            generation_method AS generationMethod,
            prompt_template_id AS promptTemplateId,
            model_name AS modelName,
            status,
            error_message AS errorMessage,
            input_token_count AS inputTokenCount,
            output_token_count AS outputTokenCount,
            estimated_cost_usd AS estimatedCostUsd,
            created_at AS createdAt,
            started_at AS startedAt,
            completed_at AS completedAt
        FROM generation_history
        WHERE job_id = #{jobId}
          AND generation_method = #{generationMethod}
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        """)
    GenerationHistory findLatestByJobIdAndMethod(
            @Param("jobId") Long jobId,
            @Param("generationMethod") GenerationMethod generationMethod
    );
}
