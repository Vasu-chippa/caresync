import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Link, useRouteError } from 'react-router-dom';

const readErrorMessage = (error) => {
  if (!error) return 'Something went wrong while loading this page.';
  if (typeof error === 'string') return error;
  if (error.statusText) return error.statusText;
  if (error.message) return error.message;
  return 'An unexpected application error occurred.';
};

export const RouteErrorPage = () => {
  const error = useRouteError();
  const message = readErrorMessage(error);

  return (
    <section className="grid min-h-[70vh] place-items-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-rose-300/20 bg-slate-900/70 p-8 text-center shadow-[0_0_30px_rgba(244,63,94,0.18)] backdrop-blur">
        <div className="mx-auto mb-4 inline-flex rounded-xl bg-rose-500/15 p-3 text-rose-300">
          <AlertTriangle size={26} />
        </div>
        <h1 className="text-2xl font-semibold text-slate-100">Something Broke</h1>
        <p className="mt-2 text-sm text-slate-300">{message}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
          >
            <RefreshCcw size={15} />
            Reload page
          </button>
          <Link
            to="/"
            className="rounded-lg border border-white/15 bg-slate-800/70 px-4 py-2 text-sm text-slate-100"
          >
            Go to home
          </Link>
        </div>
      </div>
    </section>
  );
};
