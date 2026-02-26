"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";
import { ROUTES } from "@/lib/constants";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // Wait for auth state to load
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    // Redirect based on role
    const roleRoutes: Record<string, string> = {
      DEVELOPPEUR: ROUTES.DEVELOPER,
      PRODUCT_OWNER: ROUTES.PRODUCT_OWNER,
      TESTEUR_QA: ROUTES.QA,
      SCRUM_MASTER: ROUTES.SCRUM_MASTER,
      SUPER_ADMIN: ROUTES.SUPER_ADMIN,
    };

    const roleCode = user.role?.code || "";
    const targetRoute = roleRoutes[roleCode];
    
    if (targetRoute) {
      router.replace(targetRoute);
    } else {
      // Fallback to login if role is unknown
      router.replace(ROUTES.LOGIN);
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show loading spinner while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4 text-slate-600 dark:text-[#9dabb9]">
          Redirecting...
        </p>
      </div>
    </div>
  );
}
