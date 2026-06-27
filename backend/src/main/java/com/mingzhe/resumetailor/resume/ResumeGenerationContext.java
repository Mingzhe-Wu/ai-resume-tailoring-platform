package com.mingzhe.resumetailor.resume;

import com.mingzhe.resumetailor.education.Education;
import com.mingzhe.resumetailor.experience.Experience;
import com.mingzhe.resumetailor.job.Job;
import com.mingzhe.resumetailor.profile.Profile;
import com.mingzhe.resumetailor.project.Project;
import com.mingzhe.resumetailor.skill.Skill;

import java.util.List;

/**
 * Groups the job, profile, and resume sections needed for AI resume generation.
 */
public class ResumeGenerationContext {
    private Job job;
    private Profile profile;
    private List<Experience> experiences;
    private List<Education> educations;
    private List<Project> projects;
    private List<Skill> skills;

    public Job getJob() {
        return job;
    }

    public void setJob(Job job) {
        this.job = job;
    }

    public Profile getProfile() {
        return profile;
    }

    public void setProfile(Profile profile) {
        this.profile = profile;
    }

    public List<Experience> getExperiences() {
        return experiences;
    }

    public void setExperiences(List<Experience> experiences) {
        this.experiences = experiences;
    }

    public List<Education> getEducations() {
        return educations;
    }

    public void setEducations(List<Education> educations) {
        this.educations = educations;
    }

    public List<Project> getProjects() {
        return projects;
    }

    public void setProjects(List<Project> projects) {
        this.projects = projects;
    }

    public List<Skill> getSkills() {
        return skills;
    }

    public void setSkills(List<Skill> skills) {
        this.skills = skills;
    }

}
