"use client";

import { useEffect, useState } from "react";
import { Toaster as SonnerToaster } from "sonner";

export function ToastProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <SonnerToaster
      position="top-right"
      theme="dark"
      toastOptions={{
        style: {
          background: "#0f172a",
          border: "1px solid #1e293b",
          color: "#f8fafc",
        },
      }}
    />
  );
}
