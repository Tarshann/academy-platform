import { useEffect } from "react";
import { useLocation } from "wouter";

export default function RegisterRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/signup");
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  );
}
