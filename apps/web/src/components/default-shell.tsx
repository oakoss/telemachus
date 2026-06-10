// Placeholder shells: plain semantic markup until the react-aria/Intent-UI
// base lands (ADR-005, R1).
export function DefaultShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-gray-200 px-8 py-4">
        <span className="font-semibold">Telemachus</span>
      </header>
      <main>{children}</main>
    </>
  );
}
