package com.mingzhe.resumetailor.user;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Represents User data in the application.
 */
@Data
public class User {

    private Long id;

    private String email;

    private String password;

    private LocalDateTime createdAt;

}
