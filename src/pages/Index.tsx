import { useState, useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import { AuthPage } from "@/components/AuthPage";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking authentication status
    const checkAuth = () => {
      const hasAuth = localStorage.getItem("job-tracker-auth");
      setIsAuthenticated(!!hasAuth);
      setIsLoading(false);
    };

    // Simulate network delay
    setTimeout(checkAuth, 500);
  }, []);

  // Simulate login success
  useEffect(() => {
    const handleStorageChange = () => {
      const hasAuth = localStorage.getItem("job-tracker-auth");
      setIsAuthenticated(!!hasAuth);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <AuthPage />;
};

export default Index;
