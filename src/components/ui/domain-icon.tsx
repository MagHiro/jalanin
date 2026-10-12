import { Bell, BriefcaseBusiness, Compass, FileText, House, Inbox, LayoutDashboard, Mail, Users } from "lucide-react";

/** Shared migration adapter for the existing route icon vocabulary. */
export function DomainIcon({ name, size = 20 }: { name: string; size?: number }) {
  const icons: Record<string, typeof House> = { "⌂": House, "▤": BriefcaseBusiness, "☰": FileText, "✦": Compass, "○": Users, "✉": Mail, "●": Bell, "J": LayoutDashboard };
  const Icon = icons[name] ?? Inbox;
  return <Icon size={size} strokeWidth={1.7} aria-hidden="true" />;
}
