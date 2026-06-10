import { createFileRoute } from '@tanstack/react-router';

// Placeholder until Better Auth lands (telemachus-1or.1).
export const Route = createFileRoute('/_auth/sign-up')({ component: SignUp });

function SignUp() {
  return (
    <>
      <h1 className="text-2xl font-bold">Sign up</h1>
      <p className="mt-2 text-sm text-gray-600">
        Authentication arrives at R1.
      </p>
    </>
  );
}
