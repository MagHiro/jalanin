import { StudentRecordsMotion } from "@/components/motion/student-records-motion";
import "@/app/dashboard/student-records.css";
import "./admin-records.css";

/** Reuse the approved student applications presentation without changing admin data. */
export function AdminRecords({ children, filters }: {
  children: React.ReactNode;
  filters: Record<string, string | undefined>;
}) {
  return <StudentRecordsMotion className="admin-records-page" viewKey={JSON.stringify(filters)}>{children}</StudentRecordsMotion>;
}
