import { useRevokeSession, useSessions } from '../hooks';

export const SessionPanel = () => {
  const sessionsQuery = useSessions();
  const revokeMutation = useRevokeSession();

  if (sessionsQuery.isLoading) {
    return <p className="text-sm text-(--text-soft)">Loading sessions...</p>;
  }

  if (sessionsQuery.isError) {
    return <p className="text-sm text-red-700">{sessionsQuery.error.message}</p>;
  }

  return (
    <div className="space-y-2">
      {(sessionsQuery.data || []).map((session) => (
        <div key={session.sessionId} className="rounded-lg border border-(--border) p-3 text-sm">
          <p className="font-medium text-(--text-strong)">Session {session.sessionId.slice(0, 8)}...</p>
          <p>IP: {session.ip || 'N/A'}</p>
          <p>User-Agent: {session.userAgent || 'N/A'}</p>
          <button
            type="button"
            onClick={() => revokeMutation.mutate(session.sessionId)}
            className="mt-2 rounded-md border border-(--border) px-2 py-1 text-xs"
          >
            Revoke
          </button>
        </div>
      ))}
    </div>
  );
};
