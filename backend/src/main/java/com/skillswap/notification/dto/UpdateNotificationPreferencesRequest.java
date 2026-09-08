package com.skillswap.notification.dto;

public record UpdateNotificationPreferencesRequest(
        Boolean exchangeRequests,
        Boolean sessions,
        Boolean messages,
        Boolean reviews,
        Boolean safety
) {}
