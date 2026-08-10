import { Navbar } from './Navbar';

export function PageContainer({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">
        {(title || subtitle) && (
          <header className="mb-6">
            {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
          </header>
        )}
        {children}
      </main>
    </div>
  );
}
