package com.mingzhe.resumetailor.skillkeyword;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/skill-keywords")
@CrossOrigin(origins = "http://localhost:5173")
public class SkillKeywordController {

    private final SkillKeywordService skillKeywordService;

    public SkillKeywordController(SkillKeywordService skillKeywordService) {
        this.skillKeywordService = skillKeywordService;
    }

    @GetMapping
    public ResponseEntity<List<SkillKeywordResponseDTO>> findEnabledKeywords() {
        return ResponseEntity.ok(skillKeywordService.findEnabledKeywords());
    }
}
