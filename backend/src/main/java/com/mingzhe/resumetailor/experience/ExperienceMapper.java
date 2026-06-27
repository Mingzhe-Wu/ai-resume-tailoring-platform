package com.mingzhe.resumetailor.experience;

import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * MyBatis mapper for Experience database operations.
 */
@Mapper
public interface ExperienceMapper {

    @Insert("""
        INSERT INTO experiences (
            profile_id,
            company_name,
            position,
            location,
            start_date,
            end_date,
            description
        ) VALUES (
            #{profileId},
            #{companyName},
            #{position},
            #{location},
            #{startDate},
            #{endDate},
            #{description}
        )
        """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Experience experience);

    @Select("""
        SELECT
            id,
            profile_id,
            company_name,
            position,
            location,
            start_date,
            end_date,
            description,
            created_at,
            updated_at
        FROM experiences
        WHERE id = #{id}
        """)
    Experience findById(Long id);

    @Select("""
        SELECT
            id,
            profile_id,
            company_name,
            position,
            location,
            start_date,
            end_date,
            description,
            created_at,
            updated_at
        FROM experiences
        WHERE profile_id = #{profileId}
        ORDER BY start_date DESC, id DESC
        """)
    List<Experience> findByProfileId(Long profileId);

    @Update("""
        <script>
        UPDATE experiences
        <set>
            <if test="companyName != null">company_name = #{companyName},</if>
            <if test="position != null">position = #{position},</if>
            <if test="location != null">location = #{location},</if>
            <if test="startDate != null">start_date = #{startDate},</if>
            <if test="endDate != null">end_date = #{endDate},</if>
            <if test="description != null">description = #{description},</if>
            updated_at = NOW()
        </set>
        WHERE id = #{id}
        </script>
        """)
    int updateById(Experience experience);

    @Delete("""
        DELETE FROM experiences
        WHERE id = #{id}
        """)
    int deleteById(Long id);

}
