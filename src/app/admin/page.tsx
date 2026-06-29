import { redirect } from "next/navigation";

/**
 * /admin root — redirect to dashboard.
 * The proxy middleware handles auth gating, so unauthenticated users
 * get redirected to /admin/login before this page even renders.
 */
export default function AdminPage() {
  redirect("/admin/dashboard");
}
