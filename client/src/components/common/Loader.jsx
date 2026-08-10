export function Loader({ message = 'Loading…', fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-ateneo-blue border-t-transparent" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center">{content}</div>
    );
  }

  return <div className="flex justify-center py-12">{content}</div>;
}
