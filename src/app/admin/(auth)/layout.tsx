/**
 * Auth route group layout — completely bare, no sidebar or header.
 * This wraps /admin/login only.
 */
export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
