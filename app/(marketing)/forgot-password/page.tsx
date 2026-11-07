import type { Metadata } from "next";
import { AuthCard } from "@/components/landing/auth-card";

export const metadata: Metadata = { title: "Reset your password · Finlio" };

export default function Page() {
  return <AuthCard mode="forgot" />;
}
