package com.mingzhe.resumetailor.experience;

import com.mingzhe.resumetailor.exceptions.BadRequestException;
import com.mingzhe.resumetailor.exceptions.ResourceNotFoundException;
import com.mingzhe.resumetailor.profile.Profile;
import com.mingzhe.resumetailor.profile.ProfileMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Business logic for validating and managing Experience records.
 */
@Service
public class ExperienceService {

    private final ExperienceMapper experienceMapper;
    private final ProfileMapper profileMapper;

    public ExperienceService(ExperienceMapper experienceMapper, ProfileMapper profileMapper) {
        this.experienceMapper = experienceMapper;
        this.profileMapper = profileMapper;
    }

    // Create a new experience under given profile id
    public Experience createExperience(CreateExperienceDTO request) {
        Profile profile = profileMapper.findById(request.getProfileId());
        if (profile == null) {
            throw new ResourceNotFoundException("Profile not found");
        }

        // Validate the end date and start date when both provided
        if (request.getEndDate() != null && request.getStartDate() != null
                && request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("endDate cannot be before startDate");
        }

        Experience experience = new Experience();
        experience.setProfileId(request.getProfileId());
        experience.setCompanyName(request.getCompanyName());
        experience.setPosition(request.getPosition());
        experience.setLocation(request.getLocation());
        experience.setStartDate(request.getStartDate());
        experience.setEndDate(request.getEndDate());
        experience.setDescription(request.getDescription());

        experienceMapper.insert(experience);
        return experience;
    }

    // Fetch all experiences with the given profileId
    public List<Experience> fetchExperiencesByProfileId(Long profileId) {
        Profile profile = profileMapper.findById(profileId);
        if (profile == null) {
            throw new ResourceNotFoundException("Profile not found");
        }

        return experienceMapper.findByProfileId(profileId);
    }

    // Update the given experience with experience id
    public Experience updateExperience(Long id, UpdateExperienceDTO request) {
        Experience existingExperience = experienceMapper.findById(id);
        if (existingExperience == null) {
            throw new ResourceNotFoundException("Experience not found");
        }

        // Check if the updated start date/end date are still valid
        LocalDate startDateToCheck = request.getStartDate() != null
                ? request.getStartDate()
                : existingExperience.getStartDate();
        LocalDate endDateToCheck = request.getEndDate() != null
                ? request.getEndDate()
                : existingExperience.getEndDate();

        if (endDateToCheck != null && startDateToCheck != null && endDateToCheck.isBefore(startDateToCheck)) {
            throw new BadRequestException("endDate cannot be before startDate");
        }

        Experience update = new Experience();
        update.setId(id);
        update.setCompanyName(request.getCompanyName());
        update.setPosition(request.getPosition());
        update.setLocation(request.getLocation());
        update.setStartDate(request.getStartDate());
        update.setEndDate(request.getEndDate());
        update.setDescription(request.getDescription());

        experienceMapper.updateById(update);
        return experienceMapper.findById(id);
    }

    // Delete experience with given experience id
    public void deleteExperience(Long id) {
        Experience existingExperience = experienceMapper.findById(id);
        if (existingExperience == null) {
            throw new ResourceNotFoundException("Experience not found");
        }

        experienceMapper.deleteById(id);
    }

}
