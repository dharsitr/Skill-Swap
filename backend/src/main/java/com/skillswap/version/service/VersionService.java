package com.skillswap.version.service;

import com.skillswap.version.dto.AppVersionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class VersionService {

    @Value("${spring.application.name:SkillSwap API}")
    private String applicationName;

    @Value("${app.version:0.1.0}")
    private String appVersion;

    public AppVersionResponse getVersionInfo() {
        return new AppVersionResponse(applicationName, appVersion);
    }
}
