import { useQuery } from "@tanstack/react-query";
import { getDashboardStatsApi, getActivityDataApi } from "./api";

// Query keys
export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
  activity: (days: number) => [...dashboardKeys.all, "activity", days] as const,
};

// Get dashboard statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: getDashboardStatsApi,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Get activity data
export function useActivityData(days: number = 30) {
  return useQuery({
    queryKey: dashboardKeys.activity(days),
    queryFn: () => getActivityDataApi(days),
  });
}
