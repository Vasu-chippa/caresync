export const UnauthorizedPage = () => {
  return (
    <section className="grid min-h-[60vh] place-items-center px-6">
      <div className="rounded-2xl border border-(--border) bg-(--surface) p-8 text-center shadow-lg">
        <h1 className="text-3xl font-semibold text-(--text-strong)">Unauthorized</h1>
        <p className="mt-2 text-(--text-soft)">You do not have permission to access this page.</p>
      </div>
    </section>
  );
};


