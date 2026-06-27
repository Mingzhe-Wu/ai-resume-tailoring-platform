package com.mingzhe.resumetailor.profile;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Represents Profile data in the application.
 */
@Data
public class Profile {

    private Long id;

    private Long userId;

    private String fullName;

    private String phone;

    private String contactEmail;

    private String linkedinUrl;

    private String githubUrl;

    private String location;

    private String summary;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String priorResume;

}
