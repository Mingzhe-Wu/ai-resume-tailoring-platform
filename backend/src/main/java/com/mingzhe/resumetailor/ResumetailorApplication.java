package com.mingzhe.resumetailor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Starts the Spring Boot resume tailoring application.
 */

@EnableAsync
@SpringBootApplication
public class ResumetailorApplication {

	public static void main(String[] args) {
		SpringApplication.run(ResumetailorApplication.class, args);
	}

}
