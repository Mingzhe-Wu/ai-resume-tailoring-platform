package com.mingzhe.resumetailor.education;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * MyBatis mapper for Education database operations.
 */
@Mapper
public interface EducationMapper {

    @Insert("""
        INSERT INTO educations (
            profile_id,
            school_name,
            degree,
            major,
            start_date,
            end_date,
            gpa,
            relevant_coursework,
            description
        ) VALUES (
            #{profileId},
            #{schoolName},
            #{degree},
            #{major},
            #{startDate},
            #{endDate},
            #{gpa},
            #{relevantCoursework},
            #{description}
        )
        """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Education education);

    @Select("""
        SELECT
            id,
            profile_id,
            school_name,
            degree,
            major,
            start_date,
            end_date,
            gpa,
            relevant_coursework,
            description,
            created_at,
            updated_at
        FROM educations
        WHERE id = #{id}
        """)
    Education findById(Long id);

    @Select("""
        SELECT
            id,
            profile_id,
            school_name,
            degree,
            major,
            start_date,
            end_date,
            gpa,
            relevant_coursework,
            description,
            created_at,
            updated_at
        FROM educations
        WHERE profile_id = #{profileId}
        ORDER BY start_date DESC, id DESC
        """)
    List<Education> findByProfileId(Long profileId);

    @Update("""
        <script>
        UPDATE educations
        <set>
            <if test="schoolName != null">school_name = #{schoolName},</if>
            <if test="degree != null">degree = #{degree},</if>
            <if test="major != null">major = #{major},</if>
            <if test="startDate != null">start_date = #{startDate},</if>
            <if test="endDate != null">end_date = #{endDate},</if>
            <if test="gpa != null">gpa = #{gpa},</if>
            <if test="relevantCoursework != null">relevant_coursework = #{relevantCoursework},</if>
            <if test="description != null">description = #{description},</if>
            updated_at = NOW()
        </set>
        WHERE id = #{id}
        </script>
        """)
    int updateById(Education education);

    @Delete("""
        DELETE FROM educations
        WHERE id = #{id}
        """)
    int deleteById(Long id);

}
