import axiosInstance from "@/lib/axios";

export interface AuditLog {
  id: number;
  userId?: number;
  action: string;
  entityType?: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  timestamp: string;
  user?: {
    id: number;
    nom: string;
    email: string;
  };
}

export interface SystemLog {
  id: number;
  niveau: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  message: string;
  module?: string;
  timestamp: string;
  details?: string;
}

export interface LogFilters {
  user_id?: number;
  action?: string;
  entity_type?: string;
  start_date?: string;
  end_date?: string;
  ip_address?: string;
  skip?: number;
  limit?: number;
}

export interface SystemLogFilters {
  niveau?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  module?: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}

// Response interfaces with pagination
export interface AuditLogsResponse {
  total: number;
  skip: number;
  limit: number;
  filters_applied: Record<string, any>;
  logs: AuditLog[];
}

export interface SystemLogsResponse {
  total: number;
  skip: number;
  limit: number;
  logs: SystemLog[];
}

// Get audit logs with filters
export async function getAuditLogsApi(filters: LogFilters = {}): Promise<AuditLog[]> {
  const { data } = await axiosInstance.get<AuditLogsResponse>("/logs/audit", {
    params: filters,
  });
  return data.logs;
}

// Get critical audit logs
export async function getCriticalAuditLogsApi(hours: number = 24): Promise<AuditLog[]> {
  const { data } = await axiosInstance.get<{ total: number; window_hours: number; critical_actions_monitored: string[]; logs: AuditLog[] }>("/logs/audit/critical", {
    params: { hours },
  });
  return data.logs;
}

// Get available actions for filters
export async function getAvailableActionsApi(): Promise<string[]> {
  const { data } = await axiosInstance.get<{ actions: string[] }>("/logs/audit/actions");
  return data.actions;
}

// Get system logs with filters
export async function getSystemLogsApi(filters: SystemLogFilters = {}): Promise<SystemLog[]> {
  const { data } = await axiosInstance.get<SystemLogsResponse>("/logs/system", {
    params: filters,
  });
  return data.logs;
}

// Export audit logs as CSV
export async function exportAuditLogsApi(filters: LogFilters = {}): Promise<Blob> {
  const { data } = await axiosInstance.get("/logs/audit/export", {
    params: filters,
    responseType: "blob",
  });
  return data;
}
