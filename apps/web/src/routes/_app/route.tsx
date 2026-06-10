import { Outlet, createFileRoute } from '@tanstack/react-router';

import { SidebarShell } from '#/components/sidebar-shell.tsx';

// TODO(telemachus-1or.1): auth middleware in beforeLoad — redirect
// unauthenticated users to /sign-in once Better Auth lands.
export const Route = createFileRoute('/_app')({ component: AppLayout });

function AppLayout() {
  return (
    <SidebarShell>
      <Outlet />
    </SidebarShell>
  );
}
