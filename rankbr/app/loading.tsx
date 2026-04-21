export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#00A651]" />
      <p className="text-sm text-gray-400">Carregando...</p>
    </div>
  );
}
