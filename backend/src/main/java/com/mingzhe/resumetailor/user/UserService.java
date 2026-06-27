package com.mingzhe.resumetailor.user;

import com.mingzhe.resumetailor.auth.UserRequestDTO;
import com.mingzhe.resumetailor.exceptions.BadRequestException;
import com.mingzhe.resumetailor.exceptions.ResourceNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Business logic for validating and managing User records.
 */
@Service
public class UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponseDTO register(UserRequestDTO request) {
        User existingUser = userMapper.findByEmail(request.getEmail());
        if (existingUser != null) {
            throw new BadRequestException("User already exists with this email");
        }

        User user = new User();
        user.setEmail(request.getEmail());

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        user.setPassword(encodedPassword);

        userMapper.insert(user);

        UserResponseDTO response = new UserResponseDTO();
        response.setId(user.getId());
        response.setEmail(user.getEmail());

        return response;
    }

    public User createUser(CreateUserDTO request) {
        User existingUser = userMapper.findByEmail(request.getEmail());
        if (existingUser != null) {
            throw new BadRequestException("User already exists with this email");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());

        userMapper.insert(user);
        return user;
    }

    public User fetchUserById(Long id) {
        User user = userMapper.findById(id);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        return user;
    }

    public User fetchUserByEmail(String email) {
        User user = userMapper.findByEmail(email);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }
        return user;
    }

    public User updateUser(Long id, UpdateUserDTO request) {
        User existingUser = userMapper.findById(id);
        if (existingUser == null) {
            throw new ResourceNotFoundException("User not found");
        }

        if (request.getEmail() != null) {
            User existingEmailUser = userMapper.findByEmail(request.getEmail());
            if (existingEmailUser != null && !existingEmailUser.getId().equals(id)) {
                throw new BadRequestException("User already exists with this email");
            }
        }

        User update = new User();
        update.setId(id);
        update.setEmail(request.getEmail());
        update.setPassword(request.getPassword());

        userMapper.updateById(update);
        return userMapper.findById(id);
    }

    public void deleteUser(Long id) {
        User existingUser = userMapper.findById(id);
        if (existingUser == null) {
            throw new ResourceNotFoundException("User not found");
        }

        userMapper.deleteById(id);
    }

}
