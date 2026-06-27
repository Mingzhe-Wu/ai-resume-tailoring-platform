package com.mingzhe.resumetailor.project;

import com.mingzhe.resumetailor.exceptions.BadRequestException;
import com.mingzhe.resumetailor.exceptions.ResourceNotFoundException;
import com.mingzhe.resumetailor.profile.Profile;
import com.mingzhe.resumetailor.profile.ProfileMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Business logic for validating and managing Project records.
 */
@Service
public class ProjectService {

    private final ProjectMapper projectMapper;
    private final ProfileMapper profileMapper;

    public ProjectService(ProjectMapper projectMapper, ProfileMapper profileMapper) {
        this.projectMapper = projectMapper;
        this.profileMapper = profileMapper;
    }

    public Project createProject(CreateProjectDTO request) {
        Profile profile = profileMapper.findById(request.getProfileId());
        if (profile == null) {
            throw new ResourceNotFoundException("Profile not found");
        }

        if (request.getEndDate() != null && request.getStartDate() != null
                && request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("endDate cannot be before startDate");
        }

        Project project = new Project();
        project.setProfileId(request.getProfileId());
        project.setProjectName(request.getProjectName());
        project.setTechStack(request.getTechStack());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setDescription(request.getDescription());

        projectMapper.insert(project);
        return project;
    }

    public List<Project> fetchProjectsByProfileId(Long profileId) {
        Profile profile = profileMapper.findById(profileId);
        if (profile == null) {
            throw new ResourceNotFoundException("Profile not found");
        }

        return projectMapper.findByProfileId(profileId);
    }

    public Project updateProject(Long id, UpdateProjectDTO request) {
        Project existingProject = projectMapper.findById(id);
        if (existingProject == null) {
            throw new ResourceNotFoundException("Project not found");
        }

        LocalDate startDateToCheck = request.getStartDate() != null
                ? request.getStartDate()
                : existingProject.getStartDate();
        LocalDate endDateToCheck = request.getEndDate() != null
                ? request.getEndDate()
                : existingProject.getEndDate();

        if (endDateToCheck != null && startDateToCheck != null && endDateToCheck.isBefore(startDateToCheck)) {
            throw new BadRequestException("endDate cannot be before startDate");
        }

        Project update = new Project();
        update.setId(id);
        update.setProjectName(request.getProjectName());
        update.setTechStack(request.getTechStack());
        update.setStartDate(request.getStartDate());
        update.setEndDate(request.getEndDate());
        update.setDescription(request.getDescription());

        projectMapper.updateById(update);
        return projectMapper.findById(id);
    }

    public void deleteProject(Long id) {
        Project existingProject = projectMapper.findById(id);
        if (existingProject == null) {
            throw new ResourceNotFoundException("Project not found");
        }

        projectMapper.deleteById(id);
    }

}
