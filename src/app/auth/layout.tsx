import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import "./auth.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-calm">
      <aside className="auth-calm-story" aria-label="Your next chapter">
        <Image src="/images/singapore.jpg" alt="" fill priority sizes="50vw" className="auth-calm-photo" />
        <div className="auth-calm-story-copy">
          <p>Your next chapter</p>
          <h2>There is more<br />ahead of you.</h2>
          <p>Find an internship that moves you forward.</p>
        </div>
        <span className="auth-calm-location">Singapore, Southeast Asia</span>
      </aside>
      <main id="main" className="auth-calm-panel">
        <header className="auth-calm-header">
          <Link href="/" aria-label="Jalanin home"><Image src="/logo.png" alt="Jalanin" width={180} height={60} className="auth-calm-logo" /></Link>
          <Link href="/opportunities" className="auth-calm-back">Browse internships <span aria-hidden="true">↗</span></Link>
        </header>
        <div className="auth-calm-content">{children}</div>
        <footer className="auth-calm-footer"><span>Jalanin student account</span><nav aria-label="Legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></footer>
      </main>
    </div>
  );
}
