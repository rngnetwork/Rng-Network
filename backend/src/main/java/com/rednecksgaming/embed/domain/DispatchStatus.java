package com.rednecksgaming.embed.domain;

/**
 * Lifecycle status of an embed dispatch task.
 */
public enum DispatchStatus {
    QUEUED,
    PROCESSING,
    RETRYING,
    SUCCESS,
    FAILED,
    CANCELLED
}
