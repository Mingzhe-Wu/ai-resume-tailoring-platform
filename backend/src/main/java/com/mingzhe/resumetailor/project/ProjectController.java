package com.mingzhe.resumetailor.project;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for managing Project records.
 */
@RestController
@RequestMapping("/api/project")
@CrossOrigin(origins = "http://localhost:5173")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping("/create")
    public ResponseEntity<Project> createProject(@RequestBody @Valid CreateProjectDTO request) {
        Project createdProject = projectService.createProject(request);
        return ResponseEntity.status(201).body(createdProject);
    }

    @GetMapping("/fetch/{profileId}")
    public ResponseEntity<List<Project>> getProjectsByProfileId(@PathVariable Long profileId) {
        return ResponseEntity.ok(projectService.fetchProjectsByProfileId(profileId));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Project> updateProject(@PathVariable Long id,
                                                 @RequestBody UpdateProjectDTO request) {
        return ResponseEntity.ok(projectService.updateProject(id, request));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

}
