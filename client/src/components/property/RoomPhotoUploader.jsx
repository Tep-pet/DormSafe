import React, { useEffect, useRef } from 'react';
import { Card, Chip, Button as HeroUIButton } from '@heroui/react';
import { Camera, X, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { IMAGE_SIZE_HINT } from '../../constants/uploadLimits';

const MAX_PHOTOS = 8;
const ACCEPT =
  '.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif';

/**
 * RoomPhotoUploader Component
 * Allows owners to upload and preview multiple property/room photos.
 * Adheres to Golden DormSafe Design Standards.
 */
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
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Property & room photos
          </label>
          <p className="mt-0.5 text-xs text-slate-500 font-normal">
            Upload up to {MAX_PHOTOS} photos. The first image acts as the primary listing cover. {IMAGE_SIZE_HINT}.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200/80">
          {photos.length}/{MAX_PHOTOS} Photos
        </span>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <Card
              key={photo.previewUrl}
              shadow="sm"
              className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white"
            >
              <img
                src={photo.previewUrl}
                alt={`Room preview ${index + 1}`}
                className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              {index === 0 && (
                <div className="absolute left-2 top-2 z-10">
                  <Chip
                    size="sm"
                    color="primary"
                    variant="solid"
                    className="h-5 px-2 text-[10px] font-bold shadow-xs bg-ateneo-blue text-white"
                  >
                    Cover Photo
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
                className="absolute right-2 top-2 z-10 h-6 w-6 min-w-6 bg-black/60 text-white backdrop-blur-xs hover:bg-rose-600 hover:scale-110 transition-all p-0"
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
            className="group flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300/90 bg-slate-50/50 py-7 px-4 text-center transition-all duration-200 hover:border-ateneo-blue hover:bg-blue-50/30 hover:shadow-xs cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100/80 text-ateneo-blue group-hover:scale-110 transition-transform duration-200">
              <UploadCloud size={20} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 group-hover:text-ateneo-blue transition-colors">
                {photos.length === 0 ? 'Click or drag to upload room & property photos' : 'Add more photos'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                PNG, JPG, WEBP, HEIC up to 5MB each
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
