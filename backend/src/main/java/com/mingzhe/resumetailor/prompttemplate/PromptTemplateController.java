package com.mingzhe.resumetailor.prompttemplate;

import com.mingzhe.resumetailor.exceptions.BadRequestException;
import com.mingzhe.resumetailor.user.User;
import com.mingzhe.resumetailor.user.UserMapper;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/prompt-templates")
@CrossOrigin(origins = "http://localhost:5173")
public class PromptTemplateController {

    private final PromptTemplateService promptTemplateService;
    private final UserMapper userMapper;

    public PromptTemplateController(
            PromptTemplateService promptTemplateService,
            UserMapper userMapper
    ) {
        this.promptTemplateService = promptTemplateService;
        this.userMapper = userMapper;
    }

    @GetMapping("/effective")
    public ResponseEntity<PromptTemplateResponseDTO> getEffectivePrompt(
            @RequestParam PromptTemplateType type,
            Principal principal
    ) {
        Long userId = getCurrentUserId(principal);
        PromptTemplate promptTemplate = promptTemplateService.getEffectivePrompt(userId, type);
        return ResponseEntity.ok(PromptTemplateResponseDTO.from(promptTemplate));
    }

    @PutMapping
    public ResponseEntity<PromptTemplateResponseDTO> savePrompt(
            @RequestParam PromptTemplateType type,
            @RequestBody @Valid SavePromptTemplateDTO request,
            Principal principal
    ) {
        Long userId = getCurrentUserId(principal);
        PromptTemplate promptTemplate = promptTemplateService.saveUserPrompt(
                userId,
                type,
                request.getContent()
        );
        return ResponseEntity.ok(PromptTemplateResponseDTO.from(promptTemplate));
    }

    @DeleteMapping
    public ResponseEntity<Void> resetPrompt(
            @RequestParam PromptTemplateType type,
            Principal principal
    ) {
        Long userId = getCurrentUserId(principal);
        promptTemplateService.resetUserPrompt(userId, type);
        return ResponseEntity.noContent().build();
    }

    private Long getCurrentUserId(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new BadRequestException("Authenticated user is required.");
        }

        User user = userMapper.findByEmail(principal.getName());
        if (user == null) {
            throw new BadRequestException("Authenticated user was not found.");
        }

        return user.getId();
    }
}
