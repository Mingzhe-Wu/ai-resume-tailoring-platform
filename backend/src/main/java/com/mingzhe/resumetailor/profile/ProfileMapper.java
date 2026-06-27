package com.mingzhe.resumetailor.profile;

import org.apache.ibatis.annotations.*;

/**
 * MyBatis mapper for Profile database operations.
 */
@Mapper
public interface ProfileMapper {
    // Insert the new profile into the database, and set id of the profile to the auto-generated
    @Insert("""
    INSERT INTO profiles (
        user_id,
        full_name,
        phone,
        contact_email,
        linkedin_url,
        github_url,
        location,
        summary,
        created_at,
        updated_at,
        prior_resume
    ) VALUES (
        #{userId},
        #{fullName},
        #{phone},
        #{contactEmail},
        #{linkedinUrl},
        #{githubUrl},
        #{location},
        #{summary},
        NOW(),
        NOW(),
        #{priorResume}
    )
    """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Profile profile);

    // Fetch the profile of a given user id from DB
    @Select("""
        SELECT
            id,
            user_id,
            full_name,
            phone,
            contact_email,
            linkedin_url,
            github_url,
            location,
            summary,
            created_at,
            updated_at,
            prior_resume
        FROM profiles
        WHERE user_id = #{userId}
        """)
    Profile findByUserId(Long userId);

    // Fetch the profile of a given user id from DB
    @Select("""
        SELECT
            id,
            user_id,
            full_name,
            phone,
            contact_email,
            linkedin_url,
            github_url,
            location,
            summary,
            created_at,
            updated_at,
            prior_resume
        FROM profiles
        WHERE id = #{id}
        """)
    Profile findById(Long id);

    // Update the profile of a given user id
    @Update("""
        <script>
        UPDATE profiles
        <set>
            <if test="fullName != null">full_name = #{fullName},</if>
            <if test="phone != null">phone = #{phone},</if>
            <if test="contactEmail != null">contact_email = #{contactEmail},</if>
            <if test="linkedinUrl != null">linkedin_url = #{linkedinUrl},</if>
            <if test="githubUrl != null">github_url = #{githubUrl},</if>
            <if test="location != null">location = #{location},</if>
            <if test="summary != null">summary = #{summary},</if>
            <if test="priorResume != null">prior_resume = #{priorResume},</if>
            updated_at = NOW()
        </set>
        WHERE user_id = #{userId}
        </script>
        """)
    int updateById(Profile profile);

    // Delete the profile of a given user id
    @Delete("""
        DELETE FROM profiles
        WHERE user_id = #{userId}
        """)
    int deleteById(Long userId);

}
