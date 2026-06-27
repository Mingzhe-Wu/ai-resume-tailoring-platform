package com.mingzhe.resumetailor.education;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for managing Education records.
 */
@RestController
@RequestMapping("/api/education")
@CrossOrigin(origins = "http://localhost:5173")
public class EducationController {

    private final EducationService educationService;

    public EducationController(EducationService educationService) {
        this.educationService = educationService;
    }

    @PostMapping("/create")
    public ResponseEntity<Education> createEducation(@RequestBody @Valid CreateEducationDTO request) {
        Education createdEducation = educationService.createEducation(request);
        return ResponseEntity.status(201).body(createdEducation);
    }

    @GetMapping("/fetch/{profileId}")
    public ResponseEntity<List<Education>> getEducationsByProfileId(@PathVariable Long profileId) {
        return ResponseEntity.ok(educationService.fetchEducationsByProfileId(profileId));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Education> updateEducation(@PathVariable Long id,
                                                     @RequestBody UpdateEducationDTO request) {
        return ResponseEntity.ok(educationService.updateEducation(id, request));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteEducation(@PathVariable Long id) {
        educationService.deleteEducation(id);
        return ResponseEntity.noContent().build();
    }

}
