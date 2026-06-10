import { createFileRoute } from '@tanstack/react-router';

// Placeholder until Better Auth lands (telemachus-1or.1).
export const Route = createFileRoute('/_auth/reset-password')({
  component: ResetPassword,
});

function ResetPassword() {
  return (
    <>
      <h1 className="text-2xl font-bold">Reset password</h1>
      <p className="mt-2 text-sm text-gray-600">
        Authentication arrives at R1.
      </p>
    </>
  );
}
