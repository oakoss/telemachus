import { AppHeader } from '#/components/app-header.tsx';

export function SidebarShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside aria-label="Primary" className="w-56 border-r border-gray-200 p-4">
        <span className="text-sm text-gray-500">Navigation lands at R1</span>
      </aside>
      <div className="flex-1">
        <AppHeader />
        <main>{children}</main>
      </div>
    </div>
  );
}
