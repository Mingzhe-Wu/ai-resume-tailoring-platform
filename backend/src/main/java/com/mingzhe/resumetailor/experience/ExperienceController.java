package com.mingzhe.resumetailor.experience;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for managing Experience records.
 */
@RestController
@RequestMapping("/api/experience")
@CrossOrigin(origins = "http://localhost:5173")
public class ExperienceController {

    private final ExperienceService experienceService;

    public ExperienceController(ExperienceService experienceService) {
        this.experienceService = experienceService;
    }

    @PostMapping("/create")
    public ResponseEntity<Experience> createExperience(@RequestBody @Valid CreateExperienceDTO request) {
        Experience createdExperience = experienceService.createExperience(request);
        return ResponseEntity.status(201).body(createdExperience);
    }

    @GetMapping("/fetch/{profileId}")
    public ResponseEntity<List<Experience>> getExperiencesByProfileId(@PathVariable Long profileId) {
        return ResponseEntity.ok(experienceService.fetchExperiencesByProfileId(profileId));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Experience> updateExperience(@PathVariable Long id,
                                                       @RequestBody UpdateExperienceDTO request) {
        return ResponseEntity.ok(experienceService.updateExperience(id, request));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteExperience(@PathVariable Long id) {
        experienceService.deleteExperience(id);
        return ResponseEntity.noContent().build();
    }
}
