import { useState, useEffect } from "react";
import {
  getAuditLogsApi,
  getCriticalAuditLogsApi,
  getAvailableActionsApi,
  getSystemLogsApi,
} from "./api";
import type { LogFilters, SystemLogFilters } from "./api";

// Get audit logs
export function useAuditLogs(filters: LogFilters = {}) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const logs = await getAuditLogsApi(filters);
        setData(logs);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [filters.limit, filters.skip, filters.user_id, filters.action, filters.entity_type, filters.start_date, filters.end_date, filters.ip_address]);

  return { data, isLoading, error };
}

// Get critical audit logs
export function useCriticalAuditLogs(hours: number = 24) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const logs = await getCriticalAuditLogsApi(hours);
        setData(logs);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [hours]);

  return { data, isLoading, error };
}

// Get available actions
export function useAvailableActions() {
  const [data, setData] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchActions = async () => {
      try {
        setIsLoading(true);
        const actions = await getAvailableActionsApi();
        setData(actions);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActions();
  }, []);

  return { data, isLoading, error };
}

// Get system logs
export function useSystemLogs(filters: SystemLogFilters = {}) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const logs = await getSystemLogsApi(filters);
        setData(logs);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();

    // Refresh every 5 seconds for real-time logs
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [filters.limit, filters.skip, filters.niveau, filters.module, filters.start_date, filters.end_date]);

  return { data, isLoading, error };
}
