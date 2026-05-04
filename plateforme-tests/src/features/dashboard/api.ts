import axiosInstance from "@/lib/axios";

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRoles: number;
  systemHealth: string;
  completedSprints: number;
}

export interface ActivityData {
  date: string;
  logins: number;
  testExecutions: number;
}

export interface ProjectProgressPoint {
  date: string;
  progress: number;
}

interface HealthResponse {
  status: string;
  db?: string;
}

// Get dashboard statistics
export async function getDashboardStatsApi(): Promise<DashboardStats> {
  try {
    // Calculate stats from users list (GET /users endpoint)
    const [usersResponse, healthResponse] = await Promise.all([
      axiosInstance.get<Array<{ actif: boolean }>>("/users"),
      axiosInstance.get<HealthResponse>("/health"),
    ]);
    const users = usersResponse.data;
    
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.actif).length;
    const inactiveUsers = totalUsers - activeUsers;
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalRoles: 5, // Fixed: Super Admin, Developer, QA, Product Owner, Scrum Master
      systemHealth: healthResponse.data?.status || "DEGRADED",
      completedSprints: 0,
    };
  } catch (error) {
    // If users endpoint fails, return zeros
    console.error("Failed to fetch dashboard stats:", error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      totalRoles: 5,
      systemHealth: "DEGRADED",
      completedSprints: 0,
    };
  }
}

// Get activity data for charts
export async function getActivityDataApi(days: number = 30): Promise<ActivityData[]> {
  const response = await axiosInstance.get<ActivityData[]>(`/dashboard/activity`, {
    params: { days },
  });

  if (!Array.isArray(response.data)) {
    return [];
  }

  return response.data;
}

export async function getProductOwnerProgressApi(days: number = 30): Promise<ProjectProgressPoint[]> {
  const response = await axiosInstance.get<ProjectProgressPoint[]>(
    "/dashboard/product-owner/progress",
    {
      params: { days },
    },
  );

  if (!Array.isArray(response.data)) {
    return [];
  }

  return response.data;
}
