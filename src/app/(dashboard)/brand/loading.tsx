export default function Loading() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="h-8 w-48 bg-blue-100 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-blue-50 rounded-xl animate-pulse border border-blue-100" />
        ))}
      </div>
      <div className="h-64 bg-blue-50 rounded-xl animate-pulse border border-blue-100" />
    </div>
  );
}
