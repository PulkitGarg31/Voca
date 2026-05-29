"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FeedbackProvider } from "@/components/Feedback";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
