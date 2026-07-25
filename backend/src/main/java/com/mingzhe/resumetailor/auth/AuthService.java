package com.mingzhe.resumetailor.auth;

import com.mingzhe.resumetailor.exceptions.BadRequestException;
import com.mingzhe.resumetailor.profile.Profile;
import com.mingzhe.resumetailor.profile.ProfileMapper;
import com.mingzhe.resumetailor.security.JwtService;
import com.mingzhe.resumetailor.user.User;
import com.mingzhe.resumetailor.user.UserMapper;
import com.mingzhe.resumetailor.user.UserResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ProfileMapper profileMapper;

    public AuthService(UserMapper userMapper, PasswordEncoder passwordEncoder, JwtService jwtService, ProfileMapper profileMapper) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.profileMapper = profileMapper;
    }

    public LoginResponseDTO login(UserRequestDTO request) {

        User user = userMapper.findByEmail(request.getEmail());

        if (user == null) {
            throw new BadRequestException("Invalid email or password");
        }

        boolean passwordMatches = passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        );

        if (!passwordMatches) {
            throw new BadRequestException("Invalid email or password");
        }

        userMapper.updateLastLoginAt(user.getId());
        String token = jwtService.generateToken(user);

        UserResponseDTO userResponse = new UserResponseDTO();
        userResponse.setId(user.getId());
        userResponse.setEmail(user.getEmail());
        Profile profile = profileMapper.findByUserId(user.getId());
        if (profile != null) {
            userResponse.setFullName(profile.getFullName());
        }

        log.info("User (id = {}) {} logged in", user.getId(), user.getEmail());
        return new LoginResponseDTO(token, userResponse);
    }
}
