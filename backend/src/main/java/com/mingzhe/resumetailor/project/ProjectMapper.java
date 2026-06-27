package com.mingzhe.resumetailor.project;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * MyBatis mapper for Project database operations.
 */
@Mapper
public interface ProjectMapper {

    @Insert("""
        INSERT INTO projects (
            profile_id,
            project_name,
            tech_stack,
            start_date,
            end_date,
            description
        ) VALUES (
            #{profileId},
            #{projectName},
            #{techStack},
            #{startDate},
            #{endDate},
            #{description}
        )
        """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Project project);

    @Select("""
        SELECT
            id,
            profile_id,
            project_name,
            tech_stack,
            start_date,
            end_date,
            description,
            created_at,
            updated_at
        FROM projects
        WHERE id = #{id}
        """)
    Project findById(Long id);

    @Select("""
        SELECT
            id,
            profile_id,
            project_name,
            tech_stack,
            start_date,
            end_date,
            description,
            created_at,
            updated_at
        FROM projects
        WHERE profile_id = #{profileId}
        ORDER BY start_date DESC, id DESC
        """)
    List<Project> findByProfileId(Long profileId);

    @Update("""
        <script>
        UPDATE projects
        <set>
            <if test="projectName != null">project_name = #{projectName},</if>
            <if test="techStack != null">tech_stack = #{techStack},</if>
            <if test="startDate != null">start_date = #{startDate},</if>
            <if test="endDate != null">end_date = #{endDate},</if>
            <if test="description != null">description = #{description},</if>
            updated_at = NOW()
        </set>
        WHERE id = #{id}
        </script>
        """)
    int updateById(Project project);

    @Delete("""
        DELETE FROM projects
        WHERE id = #{id}
        """)
    int deleteById(Long id);

}
