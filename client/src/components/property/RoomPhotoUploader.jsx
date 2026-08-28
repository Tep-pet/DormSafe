import { useEffect, useRef } from 'react';

import { IMAGE_SIZE_HINT } from '../../constants/uploadLimits';

const MAX_PHOTOS = 8;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

export function RoomPhotoUploader({ photos, onChange }) {
  const inputRef = useRef(null);
  const photosRef = useRef(photos);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  function addFiles(fileList) {
    const incoming = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!incoming.length) return;

    const slotsLeft = MAX_PHOTOS - photos.length;
    const toAdd = incoming.slice(0, slotsLeft).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    onChange([...photos, ...toAdd]);
  }

  function removePhoto(index) {
    URL.revokeObjectURL(photos[index].previewUrl);
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Room Photos</label>
      <p className="mb-2 text-xs text-gray-500">
        Upload up to {MAX_PHOTOS} photos so students can see the room. The first photo is used as the
        listing thumbnail. {IMAGE_SIZE_HINT}.
      </p>

      {photos.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <div key={photo.previewUrl} className="relative">
              <img
                src={photo.previewUrl}
                alt={`Room preview ${index + 1}`}
                className="h-24 w-full rounded-lg border border-gray-200 object-cover"
              />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-ateneo-blue px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white hover:bg-black/80"
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < MAX_PHOTOS && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-sm text-gray-600 hover:border-ateneo-blue hover:text-ateneo-blue"
          >
            {photos.length === 0 ? 'Click to add room photos' : 'Add more photos'}
          </button>
        </>
      )}
    </div>
  );
}
