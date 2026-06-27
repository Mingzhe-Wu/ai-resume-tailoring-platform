package com.mingzhe.resumetailor.profile;

import com.mingzhe.resumetailor.exceptions.BadRequestException;
import com.mingzhe.resumetailor.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Business logic for validating and managing Profile records.
 */
@Service
public class ProfileService {
    private final ProfileMapper profileMapper;

    public ProfileService(ProfileMapper profileMapper) {
        this.profileMapper = profileMapper;
    }

    // Construct the profile entity from the uploaded profile DTO and call the mapper
    public Profile createProfile(CreateProfileDTO profile) {
        // See if profile already exist for the given user id
        Profile existingProfile = profileMapper.findByUserId(profile.getUserId());
        if (existingProfile != null) {
            throw new BadRequestException("Profile already exists for this user");
        }

        Profile profileEntity = new Profile();
        profileEntity.setUserId(profile.getUserId());
        profileEntity.setFullName(profile.getFullName());
        profileEntity.setPhone(profile.getPhone());
        profileEntity.setContactEmail(profile.getContactEmail());
        profileEntity.setLinkedinUrl(profile.getLinkedinUrl());
        profileEntity.setGithubUrl(profile.getGithubUrl());
        profileEntity.setLocation(profile.getLocation());
        profileEntity.setSummary(profile.getSummary());
        profileEntity.setPriorResume(profile.getPriorResume());
        profileMapper.insert(profileEntity);
        return profileEntity;
    }

    // Fetch the profile of a given user id from DB
    public Profile fetchProfile(Long userId) {
        return profileMapper.findByUserId(userId);
    }

    // Fetch the existing profile and update
    public Profile updateProfile(Long userId, UpdateProfileDTO request) {
        Profile existingProfile = profileMapper.findByUserId(userId);
        if (existingProfile == null) {
            throw new ResourceNotFoundException("Profile not found");
        }

        Profile update = new Profile();
        update.setUserId(userId);

        update.setFullName(request.getFullName());
        update.setPhone(request.getPhone());
        update.setContactEmail(request.getContactEmail());
        update.setLinkedinUrl(request.getLinkedinUrl());
        update.setGithubUrl(request.getGithubUrl());
        update.setLocation(request.getLocation());
        update.setSummary(request.getSummary());
        update.setPriorResume(request.getPriorResume());

        profileMapper.updateById(update);
        return profileMapper.findByUserId(userId);
    }

    // Delete the profile of a given user id
    public void deleteProfile(Long userId) {
        Profile existingProfile = profileMapper.findByUserId(userId);
        if (existingProfile == null) {
            throw new ResourceNotFoundException("Profile not found");
        }

        profileMapper.deleteById(userId);
    }

}
