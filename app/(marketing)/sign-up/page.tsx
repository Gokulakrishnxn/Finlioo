import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/landing/auth-card";
import { safeNext } from "@/lib/auth/routes";

export const metadata: Metadata = { title: "Sign up · Finlio" };

type Params = Promise<{ error?: string; next?: string }>;

// searchParams is runtime data, so it is read inside Suspense; the card renders
// immediately and picks up any error or return path once it resolves.
async function Card({ searchParams }: { searchParams: Params }) {
  const { error, next } = await searchParams;
  return <AuthCard mode="sign-up" error={error} next={next ? safeNext(next) : undefined} />;
}

export default function Page({ searchParams }: { searchParams: Params }) {
  return (
    <Suspense fallback={<AuthCard mode="sign-up" />}>
      <Card searchParams={searchParams} />
    </Suspense>
  );
}
