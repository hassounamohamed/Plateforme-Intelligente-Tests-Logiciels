import axiosInstance from "@/lib/axios";

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRoles: number;
  systemHealth: string;
  completedSprints: number;
  testsExecuted: number;
}

export interface ActivityData {
  date: string;
  logins: number;
  testExecutions: number;
}

// Get dashboard statistics
export async function getDashboardStatsApi(): Promise<DashboardStats> {
  try {
    // Calculate stats from users list (GET /users endpoint)
    const usersResponse = await axiosInstance.get<Array<{ actif: boolean }>>("/users");
    const users = usersResponse.data;
    
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.actif).length;
    const inactiveUsers = totalUsers - activeUsers;
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalRoles: 5, // Fixed: Super Admin, Developer, QA, Product Owner, Scrum Master
      systemHealth: "OK",
      completedSprints: 0,
      testsExecuted: 0,
    };
  } catch (error) {
    // If users endpoint fails, return zeros
    console.error("Failed to fetch dashboard stats:", error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      totalRoles: 5,
      systemHealth: "OK",
      completedSprints: 0,
      testsExecuted: 0,
    };
  }
}

// Get activity data for charts
export async function getActivityDataApi(days: number = 30): Promise<ActivityData[]> {
  // TODO: Implement this endpoint in backend
  // For now, return empty array
  return [];
}
