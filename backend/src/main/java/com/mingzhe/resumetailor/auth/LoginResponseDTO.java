package com.mingzhe.resumetailor.auth;

import com.mingzhe.resumetailor.user.UserResponseDTO;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponseDTO {
    private String token;
    private UserResponseDTO user;
}
