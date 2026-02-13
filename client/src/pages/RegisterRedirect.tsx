import { useEffect } from "react";

export default function RegisterRedirect() {
  useEffect(() => {
    window.location.href = "https://academytn.com/programs";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  );
}
