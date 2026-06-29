import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

interface Props {
  searchParams: Promise<{ from?: string }>;
}

export const metadata = {
  title: "Admin Login — Woodlands Grill House",
  description: "Secure admin portal login",
};

export default async function AdminLoginPage({ searchParams }: Props) {
  // If already authenticated, redirect to dashboard
  const session = await getSession();
  if (session) {
    redirect("/admin/dashboard");
  }

  const params = await searchParams;
  const from = params?.from;

  return <LoginForm from={from} />;
}
