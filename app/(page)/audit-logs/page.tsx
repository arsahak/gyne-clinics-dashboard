import { AuditLogRecord, getAuditLogs } from "@/app/actions/auditLogs";
import AuditLogs from "@/component/auditLogs/AuditLogs";

export const dynamic = "force-dynamic";

const AuditLogsPage = async () => {
  const response = await getAuditLogs();
  const logs = (response.success && response.data ? response.data : []) as AuditLogRecord[];

  return <AuditLogs logs={logs} />;
};

export default AuditLogsPage;
