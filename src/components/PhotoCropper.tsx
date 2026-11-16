import React, { useState, useRef, useEffect } from 'react';
import { Camera, ZoomIn, ZoomOut, RotateCw, Check, X, RefreshCw } from 'lucide-react';

interface PhotoCropperProps {
  onCropComplete: (base64Image: string) => void;
  initialImage?: string | null;
}

export const PhotoCropper: React.FC<PhotoCropperProps> = ({ onCropComplete, initialImage }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage || null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(initialImage || null);
  const [isCropping, setIsCropping] = useState<boolean>(false);

  useEffect(() => {
    if (initialImage) {
      setCroppedPreview(initialImage);
      setImageSrc(initialImage);
    }
  }, [initialImage]);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgElementRef = useRef<HTMLImageElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please choose an image file (PNG, JPG, HEIC, or WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImageSrc(result);
        setIsCropping(true);
        setZoom(1);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (imageSrc && isCropping) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        imgElementRef.current = img;
        drawCropper();
      };
    }
  }, [imageSrc, isCropping, zoom, rotation, offset]);

  const drawCropper = () => {
    const canvas = canvasRef.current;
    const img = imgElementRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width; // 320x320 preview canvas
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const minDim = Math.min(img.width, img.height);
    const baseScale = size / minDim;
    const scale = baseScale * zoom;

    const drawW = img.width * scale;
    const drawH = img.height * scale;

    ctx.drawImage(
      img,
      -drawW / 2 + offset.x,
      -drawH / 2 + offset.y,
      drawW,
      drawH
    );
    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const confirmCrop = () => {
    const img = imgElementRef.current;
    if (!img) return;

    // Export to high-resolution square 800x800 JPEG as requested by Blueprint Section 4:
    // "Photos stored as JPEG at about 800px"
    const exportSize = 800;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportSize, exportSize);

    ctx.save();
    ctx.translate(exportSize / 2, exportSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const previewSize = 320;
    const ratio = exportSize / previewSize;

    const minDim = Math.min(img.width, img.height);
    const baseScale = previewSize / minDim;
    const scale = baseScale * zoom * ratio;

    const drawW = img.width * scale;
    const drawH = img.height * scale;

    ctx.drawImage(
      img,
      -drawW / 2 + offset.x * ratio,
      -drawH / 2 + offset.y * ratio,
      drawW,
      drawH
    );
    ctx.restore();

    // Compress to 800x800 JPEG with 0.85 quality
    const compressedJpeg = exportCanvas.toDataURL('image/jpeg', 0.85);
    setCroppedPreview(compressedJpeg);
    setIsCropping(false);
    onCropComplete(compressedJpeg);
  };

  const cancelCrop = () => {
    setIsCropping(false);
  };

  const removePhoto = () => {
    setImageSrc(null);
    setCroppedPreview(null);
    onCropComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Cropping Modal / Overlay */}
      {isCropping && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-serif-title font-bold text-lg text-brand-charcoal">
                Crop Your Portrait Photo
              </h3>
              <button
                type="button"
                onClick={cancelCrop}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-brand-charcoal/70">
              Drag to position your face in the center. All alumni photos are formatted as clean squares for the directory and e-book.
            </p>

            {/* Viewport Canvas with Square framing */}
            <div 
              className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] mx-auto bg-gray-900 rounded-xl overflow-hidden cursor-move touch-none border-2 border-brand-teal select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            >
              <canvas
                ref={canvasRef}
                width={320}
                height={320}
                className="w-full h-full pointer-events-none"
              />
              {/* Circular guide overlay */}
              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/60 rounded-full m-3"></div>
            </div>

            {/* Controls: Zoom & Rotate */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-brand-teal" />
                <input
                  type="range"
                  min="0.8"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-brand-teal h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <ZoomIn className="w-4 h-4 text-brand-teal" />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-brand-charcoal transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Rotate
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelCrop}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmCrop}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-brand-teal text-white hover:bg-brand-teal-dark transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Set Photo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button or Avatar Preview */}
      {!croppedPreview ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-brand-teal/30 hover:border-brand-teal rounded-2xl p-6 text-center cursor-pointer transition-colors bg-white/70 hover:bg-brand-teal-tint/20 group"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-brand-teal-tint flex items-center justify-center text-brand-teal group-hover:scale-105 transition-transform mb-3">
            <Camera className="w-7 h-7" />
          </div>
          <span className="font-semibold text-sm text-brand-charcoal block">
            Upload Portrait Photo
          </span>
          <span className="text-xs text-brand-charcoal/60 block mt-1">
            Tap to select from phone camera or gallery (JPEG or PNG)
          </span>
          <span className="inline-block mt-3 text-[11px] font-medium text-brand-teal bg-brand-teal-tint px-2.5 py-0.5 rounded-full">
            Auto-cropped square • High-res 800px
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-brand-teal/20 shadow-xs">
          {/* Round Directory Avatar Preview */}
          <div className="relative">
            <img
              src={croppedPreview}
              alt="Alumni Portrait Preview"
              className="w-20 h-20 rounded-full object-cover border-2 border-brand-gold shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 bg-brand-teal text-white p-1 rounded-full text-[10px]">
              <Check className="w-3 h-3" />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-brand-teal block">
              Portrait Ready
            </span>
            <span className="text-[11px] text-brand-charcoal/70 block mt-0.5 truncate">
              Square cropped & compressed for directory and e-book
            </span>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsCropping(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-teal hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                Adjust Crop
              </button>
              <button
                type="button"
                onClick={removePhoto}
                className="text-xs font-semibold text-brand-red hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
