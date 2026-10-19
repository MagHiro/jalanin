import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CircleHelp, Sparkles } from "lucide-react";
import { DomainIcon } from "./domain-icon";

/** Contextual guidance; actual records, not invented data, drive the workspace. */
export function EmptyState({ title, body, actionHref, actionLabel, icon }: {
  title: string; body?: ReactNode; actionHref?: string; actionLabel?: string; icon?: ReactNode;
}) {
  const filtered = /in this view|found|matching/i.test(title);
  return <div className="workspace-empty-panel">
    <div className="workspace-empty-primary">
      <span className="workspace-empty-mark" aria-hidden="true">{icon ? typeof icon === "string" ? <DomainIcon name={icon} size={22} /> : icon : <Sparkles size={22} />}</span>
      <p className="workspace-empty-eyebrow">{filtered ? "CURRENT VIEW" : "WORKSPACE STATUS"}</p>
      <h2>{title}</h2>
      {body && <div className="workspace-empty-copy">{body}</div>}
      {actionHref && actionLabel && <Link href={actionHref} className="btn btn-primary btn-sm workspace-empty-action">{actionLabel} <ArrowRight size={15} /></Link>}
    </div>
    <div className="workspace-empty-guide">
      <span className="workspace-empty-guide-icon"><CircleHelp size={19} /></span>
      <p className="workspace-empty-guide-kicker">A useful next step</p>
      <h3>{filtered ? "Broaden your search" : "Start with what matters"}</h3>
      <p>{filtered ? "Try a different keyword or clear the current filters to see other records." : "Use the navigation to explore opportunities or related records. New activity will be shown here as soon as it is available."}</p>
      <div className="workspace-empty-guide-line"><span /><span /><span /></div>
    </div>
  </div>;
}
