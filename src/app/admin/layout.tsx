/**
 * Admin root layout — transparent passthrough.
 *
 * Route groups (auth) and (dashboard) define their own layouts:
 *   - (auth)/layout.tsx    — bare layout for /admin/login
 *   - (dashboard)/layout.tsx — sidebar+header layout for all dashboard pages
 *
 * This file must remain a simple passthrough so it does NOT apply
 * the dashboard shell to the login page.
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
