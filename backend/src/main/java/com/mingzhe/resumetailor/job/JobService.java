package com.mingzhe.resumetailor.job;

import com.mingzhe.resumetailor.exceptions.BadRequestException;
import com.mingzhe.resumetailor.exceptions.ResourceNotFoundException;
import com.mingzhe.resumetailor.resume.ResumeMapper;
import com.mingzhe.resumetailor.user.User;
import com.mingzhe.resumetailor.user.UserMapper;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Business logic for validating and managing Job records.
 */
@Service
public class JobService {

    private final JobMapper jobMapper;
    private final UserMapper userMapper;
    private final ResumeMapper resumeMapper;

    public JobService(JobMapper jobMapper, UserMapper userMapper, ResumeMapper resumeMapper) {
        this.jobMapper = jobMapper;
        this.userMapper = userMapper;
        this.resumeMapper = resumeMapper;
    }

    public Job createJob(CreateJobDTO request) {
        // use enum to validate status if provided
        Integer status = request.getStatus() == null ? 1 : request.getStatus();
        validateStatus(status);

        Integer priority = request.getPriority() == null ? 0 : request.getPriority();
        validatePriority(priority);

        // validate if user id exist in db
        User user = userMapper.findById(request.getUserId());
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        Job job = new Job();
        job.setUserId(request.getUserId());
        job.setTitle(request.getTitle());
        job.setCompany(request.getCompany());
        job.setLocation(request.getLocation());
        job.setSalary(request.getSalary());
        job.setJobDescription(request.getJobDescription());
        job.setSourceUrl(request.getSourceUrl());
        job.setStatus(status);
        job.setInterviewTime(request.getInterviewTime());
        job.setPriority(priority);
        job.setNotes(request.getNotes());

        jobMapper.insert(job);
        return job;
    }

    public List<Job> fetchJobsByUserId(Long userId) {
        // validate if user id exist in db
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        return jobMapper.findByUserId(userId);
    }

    public List<Job> searchJobs(SearchJobDTO request) {
        System.out.println(">>> service hit");
        User user = userMapper.findById(request.getUserId());
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        if (request.getStatus() != null) {
            validateStatus(request.getStatus());
        }

        System.out.println(request.getKeyword());
        System.out.println(request.getStatus());
        System.out.println(request.getUserId());

        return jobMapper.searchByUserIdAndKeyword(
                request.getUserId(),
                request.getKeyword(),
                request.getStatus()
        );
    }

    public Job updateJob(Long id, UpdateJobDTO request) {
        // validate if user id exist in db
        Job existingJob = jobMapper.findById(id);
        if (existingJob == null) {
            throw new ResourceNotFoundException("Job not found");
        }

        // use enum to validate status if provided
        if (request.getStatus() != null) {
            validateStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            validatePriority(request.getPriority());
        }

        Job update = new Job();
        update.setId(id);
        update.setTitle(request.getTitle());
        update.setCompany(request.getCompany());
        update.setLocation(request.getLocation());
        update.setSalary(request.getSalary());
        update.setJobDescription(request.getJobDescription());
        update.setSourceUrl(request.getSourceUrl());
        update.setStatus(request.getStatus());
        update.setInterviewTime(request.getInterviewTime());
        update.setPriority(request.getPriority());
        update.setNotes(request.getNotes());

        jobMapper.updateById(update);
        resumeMapper.markResumeDirtyByJobId(id);
        return jobMapper.findById(id);
    }

    public void deleteJob(Long id) {
        // validate if user id exist in db
        Job existingJob = jobMapper.findById(id);
        if (existingJob == null) {
            throw new ResourceNotFoundException("Job not found");
        }

        jobMapper.deleteById(id);
    }

    private void validateStatus(Integer status) {
        try {
            JobStatus.fromCode(status);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(ex.getMessage());
        }
    }

    private void validatePriority(Integer priority) {
        if (priority < 0) {
            throw new BadRequestException("priority must be greater than or equal to 0");
        }
    }

}
