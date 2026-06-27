package com.mingzhe.resumetailor.profile;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST endpoints for managing Profile records.
 */
@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:5173")
public class ProfileController {
    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    // Create a new profile
    @PostMapping("/create")
    public ResponseEntity<Profile> createProfile (@RequestBody @Valid CreateProfileDTO profile) {
        Profile createdProfile = profileService.createProfile(profile);
        return ResponseEntity.status(201).body(createdProfile);
    }

    // Fetch the profile of a given user id from DB
    @GetMapping("/fetch/{userId}")
    public ResponseEntity<Profile> fetchProfile (@PathVariable Long userId) {
        return ResponseEntity.ok(profileService.fetchProfile(userId));
    }

    // Update the profile of a given user id
    @PutMapping("/update/{userId}")
    public ResponseEntity<Profile> updateProfile (@PathVariable Long userId,
                                                  @RequestBody UpdateProfileDTO request) {
        return ResponseEntity.ok(profileService.updateProfile(userId, request));
    }

    // Delete the profile of a given user id
    @DeleteMapping("/delete/{userId}")
    public ResponseEntity<Void> deleteProfile(@PathVariable Long userId) {
        profileService.deleteProfile(userId);
        return ResponseEntity.noContent().build();
    }

}
