import { AuthStory } from "@/components/auth/auth-story";

export default function RecoveryLayout({ children }: { children: React.ReactNode }) {
  return <div className="auth-layout mx-auto max-w-5xl"><AuthStory /><div>{children}</div></div>;
}
