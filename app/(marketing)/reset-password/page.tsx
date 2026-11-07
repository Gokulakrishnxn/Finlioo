import type { Metadata } from "next";
import { AuthCard } from "@/components/landing/auth-card";

export const metadata: Metadata = { title: "Choose a new password · Finlio", robots: { index: false } };

export default function Page() {
  return <AuthCard mode="reset" />;
}
