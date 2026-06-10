import { Outlet, createFileRoute } from '@tanstack/react-router';

// TODO(telemachus-1or.1): reverse guard — redirect authed users to /dashboard
// once Better Auth lands.
export const Route = createFileRoute('/_auth')({ component: AuthLayout });

function AuthLayout() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-md border border-gray-200 p-6">
        <Outlet />
      </div>
    </main>
  );
}
