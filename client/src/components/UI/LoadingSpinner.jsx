export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-4' };
  const spinner = (
    <div className={`${sizes[size]} rounded-full border-slate-600 border-t-indigo-500 animate-spin`} />
  );
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full border-4 border-slate-600 border-t-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading HabiTask...</p>
        </div>
      </div>
    );
  }
  return spinner;
}
