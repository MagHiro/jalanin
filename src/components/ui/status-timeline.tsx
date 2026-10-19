import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";

/** Database-event timeline; exactly the committed workflow history. */
export function StatusTimeline({ events, emptyLabel = "Submitted — awaiting review." }: {
  events: Array<{ id: string; fromStatus?: string | null; toStatus: string; reason?: string | null; createdAt: string | Date; }>;
  emptyLabel?: string;
}) {
  if (!events.length) return <div className="workspace-timeline-pending"><Clock3 size={18} /><p>{emptyLabel}</p></div>;
  return <ol className="workspace-activity-timeline">
    {events.map((event, index) => <li key={event.id} className="workspace-activity-timeline-item">
      <span className="workspace-activity-timeline-marker" aria-hidden="true">{index === events.length - 1 ? <CheckCircle2 size={18}/> : <Clock3 size={18}/>}</span>
      <div className="workspace-activity-timeline-content">
        <div className="workspace-activity-timeline-head">
          {event.fromStatus && <><span className="workspace-activity-timeline-from">{event.fromStatus}</span><ArrowRight size={14} aria-hidden="true"/></>}
          <strong>{event.toStatus}</strong>
        </div>
        {event.reason && <p>{event.reason}</p>}
        <time className="tnum" dateTime={new Date(event.createdAt).toISOString()}>{new Date(event.createdAt).toLocaleString("en-SG")}</time>
      </div>
    </li>)}
  </ol>;
}
