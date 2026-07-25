package com.mingzhe.resumetailor.auth;

import com.mingzhe.resumetailor.exceptions.BadRequestException;
import com.mingzhe.resumetailor.profile.ProfileMapper;
import com.mingzhe.resumetailor.security.JwtService;
import com.mingzhe.resumetailor.user.User;
import com.mingzhe.resumetailor.user.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private UserMapper userMapper;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private ProfileMapper profileMapper;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userMapper = mock(UserMapper.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtService = mock(JwtService.class);
        profileMapper = mock(ProfileMapper.class);
        authService = new AuthService(userMapper, passwordEncoder, jwtService, profileMapper);
    }

    @Test
    void refreshesLastLoginAfterSuccessfulPasswordValidation() {
        UserRequestDTO request = loginRequest();
        User user = storedUser();
        when(userMapper.findByEmail(request.getEmail())).thenReturn(user);
        when(passwordEncoder.matches(request.getPassword(), user.getPassword())).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt");

        authService.login(request);

        verify(userMapper).updateLastLoginAt(user.getId());
    }

    @Test
    void doesNotRefreshLastLoginWhenPasswordIsInvalid() {
        UserRequestDTO request = loginRequest();
        User user = storedUser();
        when(userMapper.findByEmail(request.getEmail())).thenReturn(user);
        when(passwordEncoder.matches(request.getPassword(), user.getPassword())).thenReturn(false);

        assertThrows(BadRequestException.class, () -> authService.login(request));

        verify(userMapper, never()).updateLastLoginAt(user.getId());
    }

    private UserRequestDTO loginRequest() {
        UserRequestDTO request = new UserRequestDTO();
        request.setEmail("developer@example.com");
        request.setPassword("password");
        return request;
    }

    private User storedUser() {
        User user = new User();
        user.setId(42L);
        user.setEmail("developer@example.com");
        user.setPassword("encoded-password");
        return user;
    }
}
