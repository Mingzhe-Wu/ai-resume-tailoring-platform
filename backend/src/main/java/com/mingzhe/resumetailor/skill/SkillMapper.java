package com.mingzhe.resumetailor.skill;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * MyBatis mapper for Skill database operations.
 */
@Mapper
public interface SkillMapper {

    @Insert("""
        INSERT INTO skills (
            profile_id,
            category,
            name
        ) VALUES (
            #{profileId},
            #{category},
            #{name}
        )
        """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Skill skill);

    @Select("""
        SELECT
            id,
            profile_id,
            category,
            name,
            created_at,
            updated_at
        FROM skills
        WHERE id = #{id}
        """)
    Skill findById(Long id);

    @Select("""
        SELECT
            id,
            profile_id,
            category,
            name,
            created_at,
            updated_at
        FROM skills
        WHERE profile_id = #{profileId}
        ORDER BY id DESC
        """)
    List<Skill> findByProfileId(Long profileId);

    @Update("""
        <script>
        UPDATE skills
        <set>
            <if test="category != null">category = #{category},</if>
            <if test="name != null">name = #{name},</if>
            updated_at = NOW()
        </set>
        WHERE id = #{id}
        </script>
        """)
    int updateById(Skill skill);

    @Delete("""
        DELETE FROM skills
        WHERE id = #{id}
        """)
    int deleteById(Long id);

}
