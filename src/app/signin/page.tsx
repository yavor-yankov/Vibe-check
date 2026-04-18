import { Suspense } from "react";
import SignInForm from "./SignInForm";

export const metadata = {
  title: "Sign in — Vibe Check",
};

export default function SignInPage() {
  return (
    <div className="flex-1 min-h-screen grid place-items-center p-6">
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
