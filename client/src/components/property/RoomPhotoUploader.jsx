import { useEffect, useRef } from 'react';
import { Card, Chip, Button as HeroUIButton } from '@heroui/react';
import { Camera, X } from 'lucide-react';
import { IMAGE_SIZE_HINT } from '../../constants/uploadLimits';

const MAX_PHOTOS = 8;
const ACCEPT =
  '.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif';

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
    const incoming = Array.from(fileList || []).filter((f) => {
      if ((f.type || '').toLowerCase().startsWith('image/')) return true;
      const ext = (f.name || '').split('.').pop()?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'].includes(ext);
    });
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
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
          Room Photos ({photos.length}/{MAX_PHOTOS})
        </label>
        <p className="mt-0.5 text-xs text-gray-500">
          Upload up to {MAX_PHOTOS} photos. The first photo acts as the listing thumbnail. {IMAGE_SIZE_HINT}.
        </p>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <Card
              key={photo.previewUrl}
              shadow="sm"
              className="relative overflow-hidden rounded-2xl border border-gray-200 group"
            >
              <img
                src={photo.previewUrl}
                alt={`Room preview ${index + 1}`}
                className="h-28 w-full object-cover group-hover:scale-105 transition duration-200"
              />
              {index === 0 && (
                <div className="absolute left-2 top-2 z-10">
                  <Chip size="sm" color="primary" variant="solid" className="text-[10px] font-bold shadow-xs">
                    Cover
                  </Chip>
                </div>
              )}
              <HeroUIButton
                isIconOnly
                size="sm"
                color="danger"
                variant="flat"
                radius="full"
                onClick={() => removePhoto(index)}
                className="absolute right-2 top-2 z-10 h-6 w-6 min-w-6 bg-black/60 text-white backdrop-blur-xs hover:bg-red-600 transition p-0"
                aria-label="Remove photo"
              >
                <X size={13} strokeWidth={2.5} />
              </HeroUIButton>
            </Card>
          ))}
        </div>
      )}

      {photos.length < MAX_PHOTOS && (
        <div>
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
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 py-8 px-4 text-center transition hover:border-ateneo-blue hover:bg-blue-50/20 cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-ateneo-blue">
              <Camera size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">
                {photos.length === 0 ? 'Click to select room photos' : 'Add more photos'}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                PNG, JPG, WEBP up to 5MB each
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
