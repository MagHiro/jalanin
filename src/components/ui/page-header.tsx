import type { ReactNode } from "react";
import { DomainIcon } from "./domain-icon";

/** Full record-page masthead, shared by the Attio-like workspace views. */
export function PageHeader({ eyebrow, title, description, actions, icon }: {
  eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode; icon?: ReactNode;
}) {
  return <header className="page-heading">
    {eyebrow && <p className="page-heading-overline eyebrow">{eyebrow}</p>}
    <div className="page-heading-toolbar">
      <div className="page-heading-identity">
        {icon && <span aria-hidden="true" className="page-heading-icon">{typeof icon === "string" ? <DomainIcon name={icon} size={22} /> : icon}</span>}
        <h1>{title}</h1>
      </div>
      {actions && <div className="page-heading-actions">{actions}</div>}
    </div>
    {description && <div className="page-heading-description">{description}</div>}
  </header>;
}
