package com.mingzhe.resumetailor.redis;

import com.mingzhe.resumetailor.exceptions.TooManyRequestsException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Service
public class AiQuotaService {

    private final RedisCacheService redisCacheService;
    private final long dailyAiCallLimit;

    public AiQuotaService(
            RedisCacheService redisCacheService,
            @Value("${ai.quota.daily-limit:100}") long dailyAiCallLimit
    ) {
        this.redisCacheService = redisCacheService;
        this.dailyAiCallLimit = dailyAiCallLimit;
    }

    public void checkAndIncreaseDailyUsage(Long userId) {
        long count = increaseDailyUsage(userId);

        if (count > dailyAiCallLimit) {
            throw new TooManyRequestsException("Daily AI usage limit reached. Please try again tomorrow.");
        }
        log.info("Quota limit checked for userId: {}, currently {} times.", userId, count);
    }

    public long getDailyUsage(Long userId) {
        String key = RedisKeyConstants.dailyAiQuotaKey(userId, LocalDate.now());
        String value = redisCacheService.get(key);

        if (value == null) {
            return 0L;
        }

        return Long.parseLong(value);
    }

    public long getDailyRemaining(Long userId) {
        String key = RedisKeyConstants.dailyAiQuotaKey(userId, LocalDate.now());
        String value = redisCacheService.get(key);
        if (value == null) {
            return dailyAiCallLimit;
        }

        return Math.max(0, dailyAiCallLimit - Long.parseLong(value));
    }

    public long increaseDailyUsage(Long userId) {
        String key = RedisKeyConstants.dailyAiQuotaKey(userId, LocalDate.now());
        Duration ttl = durationUntilEndOfDay();

        Long count = redisCacheService.increment(key, ttl);

        return count == null ? 0L : count;
    }

    private Duration durationUntilEndOfDay() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endOfDay = now.toLocalDate().plusDays(1).atStartOfDay();

        return Duration.between(now, endOfDay);
    }

    public long getDailyLimit() {
        return dailyAiCallLimit;
    }
}
