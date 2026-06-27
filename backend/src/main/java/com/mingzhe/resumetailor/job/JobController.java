package com.mingzhe.resumetailor.job;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for managing Job records.
 */
@RestController
@RequestMapping("/api/job")
@CrossOrigin(origins = "http://localhost:5173")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @PostMapping("/create")
    public ResponseEntity<Job> createJob(@RequestBody @Valid CreateJobDTO request) {
        Job createdJob = jobService.createJob(request);
        return ResponseEntity.status(201).body(createdJob);
    }

    @GetMapping("/fetch/{userId}")
    public ResponseEntity<List<Job>> getJobsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(jobService.fetchJobsByUserId(userId));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Job> updateJob(@PathVariable Long id,
                                         @RequestBody UpdateJobDTO request) {
        return ResponseEntity.ok(jobService.updateJob(id, request));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id) {
        jobService.deleteJob(id);
        return ResponseEntity.noContent().build();
    }

}
