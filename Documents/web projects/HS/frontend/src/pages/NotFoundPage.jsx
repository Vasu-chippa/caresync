import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <section className="grid min-h-[60vh] place-items-center px-6">
      <div className="rounded-2xl border border-(--border) bg-(--surface) p-8 text-center shadow-lg">
        <h1 className="text-3xl font-semibold text-(--text-strong)">Page not found</h1>
        <p className="mt-2 text-(--text-soft)">The page you requested does not exist.</p>
        <Link
          to="/"
          className="mt-5 inline-flex rounded-lg bg-(--brand) px-4 py-2 font-medium text-white"
        >
          Back to dashboard
        </Link>
      </div>
    </section>
  );
};


