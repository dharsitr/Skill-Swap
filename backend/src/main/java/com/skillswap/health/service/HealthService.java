package com.skillswap.health.service;

import com.skillswap.health.dto.HealthStatusResponse;
import com.skillswap.health.dto.ReadinessResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Service
public class HealthService {

    private static final Logger log = LoggerFactory.getLogger(HealthService.class);
    private final DataSource dataSource;

    public HealthService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public HealthStatusResponse getHealthStatus() {
        return new HealthStatusResponse("UP");
    }

    public ReadinessResponse getReadinessStatus() {
        boolean dbUp = isDatabaseConnected();
        String status = dbUp ? "READY" : "NOT_READY";
        String dbStatus = dbUp ? "UP" : "DOWN";
        return new ReadinessResponse(status, dbStatus);
    }

    public boolean isDatabaseConnected() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            return stmt.execute("SELECT 1");
        } catch (Exception e) {
            log.warn("Database readiness check probe failed: {}", e.getMessage());
            return false;
        }
    }
}
