package com.mingzhe.resumetailor.skill;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for managing Skill records.
 */
@RestController
@RequestMapping("/api/skill")
@CrossOrigin(origins = "http://localhost:5173")
public class SkillController {

    private final SkillService skillService;

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @PostMapping("/create")
    public ResponseEntity<Skill> createSkill(@RequestBody @Valid CreateSkillDTO request) {
        Skill createdSkill = skillService.createSkill(request);
        return ResponseEntity.status(201).body(createdSkill);
    }

    @GetMapping("/fetch/{profileId}")
    public ResponseEntity<List<Skill>> getSkillsByProfileId(@PathVariable Long profileId) {
        return ResponseEntity.ok(skillService.fetchSkillsByProfileId(profileId));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Skill> updateSkill(@PathVariable Long id,
                                             @RequestBody UpdateSkillDTO request) {
        return ResponseEntity.ok(skillService.updateSkill(id, request));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteSkill(@PathVariable Long id) {
        skillService.deleteSkill(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/import/{profileId}")
    public ResponseEntity<SkillImportResponseDTO> importSkillsFromCsv(@PathVariable Long profileId,
                                                                      @RequestParam("file") MultipartFile file) {
        SkillImportResponseDTO response = skillService.importSkillsFromCsv(profileId, file);
        return ResponseEntity.ok(response);
    }

}
