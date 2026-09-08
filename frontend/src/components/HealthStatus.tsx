import React from 'react';
import { useBackendHealth, useBackendVersion } from '@/hooks/useHealth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, CheckCircle2, XCircle, Loader2, Server } from 'lucide-react';
import { apiClient } from '@/services/apiClient';

export const HealthStatus: React.FC = () => {
  const {
    data: healthData,
    isLoading: healthLoading,
    isError: healthError,
    error: healthErrorObj,
    refetch: refetchHealth,
    isFetching: healthFetching,
  } = useBackendHealth();

  const {
    data: versionData,
    isLoading: versionLoading,
  } = useBackendVersion();

  const isConnected = !healthLoading && !healthError && healthData?.status === 'UP';

  return (
    <Card className="glass-card shadow-xl" data-testid="health-status-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#1E293B] border border-slate-700/60 text-[#10B981]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-[#F8F5ED]">Backend Infrastructure</CardTitle>
              <CardDescription className="text-xs text-[#94A3B8]">Spring Boot REST API Health & Telemetry</CardDescription>
            </div>
          </div>
          <Badge
            variant={isConnected ? 'success' : healthLoading ? 'secondary' : 'destructive'}
            className="flex items-center gap-1 text-xs px-2.5 py-1"
          >
            {healthLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Checking...</span>
              </>
            ) : isConnected ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                <span>Online (UP)</span>
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                <span>Offline</span>
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#1E293B] border border-slate-800">
            <span className="text-[#94A3B8] block mb-1">API Base URL</span>
            <code className="text-[#CBD5E1] font-mono text-[11px] truncate block" title={apiClient.getBaseUrl()}>
              {apiClient.getBaseUrl()}
            </code>
          </div>

          <div className="p-3 rounded-xl bg-[#1E293B] border border-slate-800">
            <span className="text-[#94A3B8] block mb-1">API Version</span>
            <span className="text-[#F8F5ED] font-mono font-medium">
              {versionLoading ? 'Loading...' : versionData?.version || '0.1.0'}
            </span>
          </div>
        </div>

        {healthError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex items-start gap-2">
            <Activity className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Backend Connection Pending</p>
              <p className="text-red-400/80 text-[11px] mt-0.5">
                {healthErrorObj instanceof Error ? healthErrorObj.message : 'Could not reach backend service at this moment.'}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-[#94A3B8]">
            Auto-polling every 15s
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetchHealth()}
            disabled={healthFetching}
            className="h-7 text-xs gap-1.5 px-3"
          >
            <RefreshCw className={`w-3 h-3 ${healthFetching ? 'animate-spin' : ''}`} />
            <span>Check Now</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
