package com.mingzhe.resumetailor.auth;

import com.mingzhe.resumetailor.exceptions.BadRequestException;
import com.mingzhe.resumetailor.security.JwtService;
import com.mingzhe.resumetailor.user.User;
import com.mingzhe.resumetailor.user.UserMapper;
import com.mingzhe.resumetailor.user.UserResponseDTO;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserMapper userMapper, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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

        String token = jwtService.generateToken(user);

        UserResponseDTO userResponse = new UserResponseDTO();
        userResponse.setId(user.getId());
        userResponse.setEmail(user.getEmail());

        return new LoginResponseDTO(token, userResponse);
    }
}
