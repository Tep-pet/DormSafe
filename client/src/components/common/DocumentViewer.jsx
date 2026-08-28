export function DocumentViewer({ title, idUrl, licenseUrl, onClose }) {
  if (!idUrl && !licenseUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{title || 'Verification Documents'}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {idUrl && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Valid ID</p>
              <a href={idUrl} target="_blank" rel="noreferrer" className="block">
                <img src={idUrl} alt="Valid ID" className="max-h-80 w-full rounded-lg border object-contain" />
              </a>
            </div>
          )}
          {licenseUrl && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Business License / Permit</p>
              <a href={licenseUrl} target="_blank" rel="noreferrer" className="block">
                <img
                  src={licenseUrl}
                  alt="Business license"
                  className="max-h-80 w-full rounded-lg border object-contain"
                />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
