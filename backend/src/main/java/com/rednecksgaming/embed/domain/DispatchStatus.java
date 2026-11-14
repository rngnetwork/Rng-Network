// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
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
