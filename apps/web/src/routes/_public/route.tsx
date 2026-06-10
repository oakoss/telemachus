import { Outlet, createFileRoute } from '@tanstack/react-router';

import { DefaultShell } from '#/components/default-shell.tsx';

export const Route = createFileRoute('/_public')({ component: PublicLayout });

function PublicLayout() {
  return (
    <DefaultShell>
      <Outlet />
    </DefaultShell>
  );
}
