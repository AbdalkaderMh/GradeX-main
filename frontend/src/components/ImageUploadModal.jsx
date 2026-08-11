import { useNotification } from "../context/NotificationContext";
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

export default function ImageUploadModal({ isOpen, onClose, onUpload, title = "تحميل الصورة", aspect = 1 }) {
  const { showNotification } = useNotification();
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImage(reader.result));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/webp');
    });
  };

  const handleUpload = async () => {
    try {
      setLoading(true);
      const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
      await onUpload(croppedImageBlob);
      setImage(null);
      onClose();
    } catch (e) {
      console.error(e);
      showNotification("فشل في معالجة الصورة", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden oceanic-shadow flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center bg-surface-container-low/50">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 relative min-h-[300px] bg-neutral-100 flex items-center justify-center">
          {!image ? (
            <label className="cursor-pointer flex flex-col items-center gap-4 group">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">add_a_photo</span>
              </div>
              <span className="font-bold text-on-surface-variant">اختر صورة للبدء</span>
              <input type="file" className="hidden" accept="image/*" onChange={onSelectFile} />
            </label>
          ) : (
            <div className="absolute inset-0">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
          )}
        </div>

        {image && (
          <div className="p-6 bg-white space-y-6">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-outline">zoom_in</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setImage(null)}
                className="flex-1 py-3 bg-surface-container rounded-2xl font-bold hover:bg-surface-container-high transition-colors"
              >
                تغيير الصورة
              </button>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="flex-[2] py-3 bg-primary text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">cloud_upload</span>}
                <span>رفع الصورة المقصوصة</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
