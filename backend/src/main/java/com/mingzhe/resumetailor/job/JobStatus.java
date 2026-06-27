package com.mingzhe.resumetailor.job;

public enum JobStatus {
    SAVED(1),
    APPLIED(2),
    INTERVIEW(3),
    OFFER(4),
    REJECTED(5);

    private final int code;

    JobStatus(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
    }

    // iterate over the codes to validate status
    public static JobStatus fromCode(Integer code) {
        if (code == null) {
            return SAVED;
        }

        for (JobStatus status : values()) {
            if (status.code == code) {
                return status;
            }
        }

        throw new IllegalArgumentException("Invalid job status: " + code);
    }
}
