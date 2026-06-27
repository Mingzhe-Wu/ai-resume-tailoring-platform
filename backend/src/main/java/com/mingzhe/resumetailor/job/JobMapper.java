package com.mingzhe.resumetailor.job;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * MyBatis mapper for Job database operations.
 */
@Mapper
public interface JobMapper {

    @Insert("""
        INSERT INTO jobs (
            user_id,
            title,
            company,
            job_description,
            source_url,
            status,
            interview_time
        ) VALUES (
            #{userId},
            #{title},
            #{company},
            #{jobDescription},
            #{sourceUrl},
            #{status},
            #{interviewTime}
        )
        """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Job job);

    @Select("""
        SELECT
            id,
            user_id,
            title,
            company,
            job_description,
            source_url,
            status,
            interview_time,
            created_at,
            updated_at
        FROM jobs
        WHERE id = #{id}
        """)
    Job findById(Long id);

    @Select("""
        SELECT
            id,
            user_id,
            title,
            company,
            job_description,
            source_url,
            status,
            interview_time,
            created_at,
            updated_at
        FROM jobs
        WHERE user_id = #{userId}
        ORDER BY created_at DESC, id DESC
        """)
    List<Job> findByUserId(Long userId);

    @Update("""
        <script>
        UPDATE jobs
        <set>
            <if test="title != null">title = #{title},</if>
            <if test="company != null">company = #{company},</if>
            <if test="jobDescription != null">job_description = #{jobDescription},</if>
            <if test="sourceUrl != null">source_url = #{sourceUrl},</if>
            <if test="status != null">status = #{status},</if>
            <if test="interviewTime != null">interview_time = #{interviewTime},</if>
            updated_at = NOW()
        </set>
        WHERE id = #{id}
        </script>
        """)
    int updateById(Job job);

    @Delete("""
        DELETE FROM jobs
        WHERE id = #{id}
        """)
    int deleteById(Long id);

}
