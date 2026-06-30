package com.mingzhe.resumetailor.rag;

import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface ProfileEmbeddingChunkMapper {

    @Insert("""
        INSERT INTO profile_embedding_chunks (
            user_id,
            source_type,
            source_id,
            content_text,
            embedding_model,
            embedding_status
        ) VALUES (
            #{userId},
            CAST(#{sourceType} AS embedding_source_type),
            #{sourceId},
            #{contentText},
            #{embeddingModel},
            CAST(#{embeddingStatus} AS embedding_status)
        )
        """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(ProfileEmbeddingChunk chunk);

    @Select("""
        SELECT
            id,
            user_id,
            source_type,
            source_id,
            content_text,
            embedding,
            embedding_model,
            embedding_status,
            created_at,
            updated_at
        FROM profile_embedding_chunks
        WHERE id = #{id}
        """)
    @Results(id = "ProfileEmbeddingChunkResultMap", value = {
            @Result(column = "embedding", property = "embedding",
                    typeHandler = PgVectorTypeHandler.class)
    })
    ProfileEmbeddingChunk findById(Long id);

    @Select("""
        SELECT
            id,
            user_id,
            source_type,
            source_id,
            content_text,
            embedding,
            embedding_model,
            embedding_status,
            created_at,
            updated_at
        FROM profile_embedding_chunks
        WHERE user_id = #{userId}
        """)
    @ResultMap("ProfileEmbeddingChunkResultMap")
    List<ProfileEmbeddingChunk> findByUserId(Long userId);

    @Select("""
        SELECT
            id,
            user_id,
            source_type,
            source_id,
            content_text,
            embedding,
            embedding_model,
            embedding_status,
            created_at,
            updated_at
        FROM profile_embedding_chunks
        WHERE user_id = #{userId}
          AND embedding_status = CAST(#{embeddingStatus} AS embedding_status)
        """)
    @ResultMap("ProfileEmbeddingChunkResultMap")
    List<ProfileEmbeddingChunk> findByUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("embeddingStatus") EmbeddingStatus embeddingStatus
    );

    @Delete("""
        DELETE FROM profile_embedding_chunks
        WHERE user_id = #{userId}
          AND source_type = CAST(#{sourceType} AS embedding_source_type)
          AND source_id = #{sourceId}
        """)
    int deleteByUserAndSource(
            @Param("userId") Long userId,
            @Param("sourceType") EmbeddingSourceType sourceType,
            @Param("sourceId") Long sourceId
    );

    @Update("""
        <script>
        UPDATE profile_embedding_chunks
        <set>
            <if test="embedding != null">
                embedding = #{embedding, typeHandler=com.mingzhe.resumetailor.rag.PgVectorTypeHandler},
            </if>
            <if test="embeddingModel != null">
                embedding_model = #{embeddingModel},
            </if>
            <if test="embeddingStatus != null">
                embedding_status = CAST(#{embeddingStatus} AS embedding_status),
            </if>
            updated_at = NOW()
        </set>
        WHERE id = #{id}
        </script>
        """)
    int updateById(ProfileEmbeddingChunk chunk);

    @Select("""
        SELECT
            id,
            user_id,
            source_type,
            source_id,
            content_text,
            embedding <=> #{queryEmbedding, typeHandler=com.mingzhe.resumetailor.rag.PgVectorTypeHandler} AS distance
        FROM profile_embedding_chunks
        WHERE user_id = #{userId}
          AND embedding_status = CAST('READY' AS embedding_status)
          AND embedding IS NOT NULL
        ORDER BY embedding <=> #{queryEmbedding, typeHandler=com.mingzhe.resumetailor.rag.PgVectorTypeHandler}
        LIMIT #{topK}
        """)
    @Results(id = "RetrievedChunkResultMap", value = {
            @Result(column = "id", property = "id"),
            @Result(column = "user_id", property = "userId"),
            @Result(column = "source_type", property = "sourceType"),
            @Result(column = "source_id", property = "sourceId"),
            @Result(column = "content_text", property = "contentText"),
            @Result(column = "distance", property = "distance")
    })
    List<RetrievedChunkDTO> findTopKReadyChunksByEmbedding(
            @Param("userId") Long userId,
            @Param("queryEmbedding") float[] queryEmbedding,
            @Param("topK") int topK
    );

    @Select("""
        SELECT
            id,
            user_id,
            source_type,
            source_id,
            content_text,
            embedding <=> #{queryEmbedding, typeHandler=com.mingzhe.resumetailor.rag.PgVectorTypeHandler} AS distance
        FROM profile_embedding_chunks
        WHERE user_id = #{userId}
          AND source_type = CAST('SKILL' AS public."embedding_source_type")
          AND embedding_status = CAST('READY' AS public."embedding_status")
          AND embedding IS NOT NULL
        ORDER BY embedding <=> #{queryEmbedding, typeHandler=com.mingzhe.resumetailor.rag.PgVectorTypeHandler}
        LIMIT #{topK}
        """)
    @ResultMap("RetrievedChunkResultMap")
    List<RetrievedChunkDTO> findTopKReadySkillChunksByEmbedding(
            @Param("userId") Long userId,
            @Param("queryEmbedding") float[] queryEmbedding,
            @Param("topK") int topK
    );

    @Select("""
        SELECT
            id,
            user_id,
            source_type,
            source_id,
            content_text,
            embedding <=> #{queryEmbedding, typeHandler=com.mingzhe.resumetailor.rag.PgVectorTypeHandler} AS distance
        FROM profile_embedding_chunks
        WHERE user_id = #{userId}
          AND source_type IN (
              CAST('EXPERIENCE' AS public."embedding_source_type"),
              CAST('PROJECT' AS public."embedding_source_type")
          )
          AND embedding_status = CAST('READY' AS public."embedding_status")
          AND embedding IS NOT NULL
        ORDER BY embedding <=> #{queryEmbedding, typeHandler=com.mingzhe.resumetailor.rag.PgVectorTypeHandler}
        LIMIT #{topK}
        """)
    @ResultMap("RetrievedChunkResultMap")
    List<RetrievedChunkDTO> findTopKReadyExperienceAndProjectChunksByEmbedding(
            @Param("userId") Long userId,
            @Param("queryEmbedding") float[] queryEmbedding,
            @Param("topK") int topK
    );
}