import React, { useRef, useState } from 'react';
import { X, FileText, Image as ImageIcon, Star, Check } from 'lucide-react';
import { AlumniProfile } from './AlumniProfileModal';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { toPdfSafeText } from '../utils/ebookGenerator';

interface PortraitCardModalProps {
  alumni: AlumniProfile;
  onClose: () => void;
}

export const PortraitCardModal: React.FC<PortraitCardModalProps> = ({
  alumni,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Download high-resolution PNG for WhatsApp & Instagram
  const handleDownloadPng = async () => {
    setDownloadingPng(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = 1080;
      const H = 1350;
      canvas.width = W;
      canvas.height = H;

      // 1. Background gradient (Teal to Dark Teal)
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#148D93');
      grad.addColorStop(1, '#0A5054');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Decorative Gold border
      ctx.strokeStyle = '#F5A623';
      ctx.lineWidth = 12;
      ctx.strokeRect(36, 36, W - 72, H - 72);

      // Inner cream card
      ctx.fillStyle = '#FBF8F4';
      ctx.beginPath();
      ctx.roundRect(80, 80, W - 160, H - 240, 36);
      ctx.fill();

      // Top Header Badge
      ctx.fillStyle = '#148D93';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 160, 120, 320, 48, 24);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`COHORT ${alumni.cohort_year} FELLOW`, W / 2, 152);

      // Load and draw photo
      const photoImg = new Image();
      photoImg.crossOrigin = 'anonymous';
      photoImg.src = alumni.photo_key ? `/api/photo/${alumni.photo_key}` : `/api/photo/${alumni.id}.jpg`;

      await new Promise((resolve) => {
        photoImg.onload = resolve;
        photoImg.onerror = resolve; // fallback continues
      });

      const photoSize = 340;
      const photoX = (W - photoSize) / 2;
      const photoY = 210;

      // Gold outer ring
      ctx.strokeStyle = '#F5A623';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(W / 2, photoY + photoSize / 2, photoSize / 2 + 6, 0, Math.PI * 2);
      ctx.stroke();

      // Circular clipped photo
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(photoImg, photoX, photoY, photoSize, photoSize);
      ctx.restore();

      // Full Name in Serif
      ctx.fillStyle = '#1F2A30';
      ctx.font = 'bold 52px serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${alumni.first_name} ${alumni.surname}`, W / 2, 630);

      // Industry in Orange
      ctx.fillStyle = '#F7822D';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(alumni.industry?.toUpperCase() || 'EXCELLENCE FELLOW', W / 2, 680);

      // Designation
      if (alumni.role || alumni.employer) {
        let desig = alumni.role || '';
        if (alumni.employer && !alumni.hide_employer) {
          desig += desig ? ` • ${alumni.employer}` : alumni.employer;
        }
        ctx.fillStyle = '#1F2A30';
        ctx.font = '24px sans-serif';
        ctx.fillText(desig, W / 2, 730);
      }

      // Location
      const loc = `${alumni.city && !alumni.hide_city ? `${alumni.city}, ` : ''}${alumni.state}`;
      ctx.fillStyle = '#5A6B74';
      ctx.font = '22px sans-serif';
      ctx.fillText(`📍 ${loc}`, W / 2, 775);

      // Gold divider
      ctx.strokeStyle = '#F5A623';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 140, 815);
      ctx.lineTo(W / 2 + 140, 815);
      ctx.stroke();

      // Advice / Quote
      if (alumni.advice) {
        ctx.fillStyle = '#1F2A30';
        ctx.font = 'italic 28px serif';
        const quote = `"${alumni.advice.slice(0, 140)}..."`;
        ctx.fillText(quote, W / 2, 880);
      }

      // Bottom Logo (as specified in Blueprint: "Portrait card: bottom corner")
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = '/logo.png';
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
      });

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(80, H - 140, 240, 70, 16);
      ctx.fill();
      ctx.drawImage(logoImg, 95, H - 130, 210, 50);

      // Bottom right watermark text
      ctx.fillStyle = '#F5A623';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Aspire for Excellence Foundation', W - 80, H - 95);

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Aspire_Fellow_${alumni.first_name}_${alumni.surname}_Portrait.png`;
      a.click();

      setDownloadSuccess('PNG card downloaded! Perfect for WhatsApp status or LinkedIn.');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } finally {
      setDownloadingPng(false);
    }
  };

  // Download high-res vector PDF card
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const PAGE_W = 500;
      const PAGE_H = 700;
      const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Background Teal
      page.drawRectangle({
        x: 0,
        y: 0,
        width: PAGE_W,
        height: PAGE_H,
        color: rgb(0.078, 0.553, 0.576),
      });

      // Gold Border
      page.drawRectangle({
        x: 18,
        y: 18,
        width: PAGE_W - 36,
        height: PAGE_H - 36,
        borderWidth: 3,
        borderColor: rgb(0.961, 0.651, 0.137),
        color: rgb(0.078, 0.553, 0.576),
      });

      // Inner Card
      page.drawRectangle({
        x: 36,
        y: 100,
        width: PAGE_W - 72,
        height: PAGE_H - 140,
        color: rgb(0.984, 0.973, 0.957),
      });

      // Header Badge
      page.drawRectangle({
        x: PAGE_W / 2 - 80,
        y: PAGE_H - 75,
        width: 160,
        height: 24,
        color: rgb(0.078, 0.553, 0.576),
      });
      const badgeText = toPdfSafeText(`COHORT ${alumni.cohort_year} FELLOW`);
      const bw = helveticaBold.widthOfTextAtSize(badgeText, 9);
      page.drawText(badgeText, {
        x: PAGE_W / 2 - bw / 2,
        y: PAGE_H - 67,
        size: 9,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      });

      // Embed photo
      if (alumni.photo_key) {
        try {
          const photoRes = await fetch(`/api/photo/${alumni.photo_key}`);
          if (photoRes.ok) {
            const photoBuf = await photoRes.arrayBuffer();
            const photoImg = await pdfDoc.embedJpg(photoBuf);
            page.drawImage(photoImg, {
              x: PAGE_W / 2 - 80,
              y: PAGE_H - 265,
              width: 160,
              height: 160,
            });
          }
        } catch {
          // fallback
        }
      }

      // Alumnus Name
      const name = toPdfSafeText(`${alumni.first_name} ${alumni.surname}`);
      const nw = timesBold.widthOfTextAtSize(name, 24);
      page.drawText(name, {
        x: PAGE_W / 2 - nw / 2,
        y: PAGE_H - 305,
        size: 24,
        font: timesBold,
        color: rgb(0.122, 0.165, 0.188),
      });

      // Industry
      const ind = toPdfSafeText((alumni.industry || '').toUpperCase());
      const iw = helveticaBold.widthOfTextAtSize(ind, 11);
      page.drawText(ind, {
        x: PAGE_W / 2 - iw / 2,
        y: PAGE_H - 325,
        size: 11,
        font: helveticaBold,
        color: rgb(0.969, 0.510, 0.176),
      });

      // Role & Location
      const roleStr = toPdfSafeText(alumni.role || 'Aspire Fellow');
      const rw = helvetica.widthOfTextAtSize(roleStr, 11);
      page.drawText(roleStr, {
        x: PAGE_W / 2 - rw / 2,
        y: PAGE_H - 350,
        size: 11,
        font: helvetica,
        color: rgb(0.122, 0.165, 0.188),
      });

      // Advice quote
      if (alumni.advice) {
        const quote = `"${toPdfSafeText(alumni.advice).slice(0, 120)}..."`;
        page.drawText(quote, {
          x: 60,
          y: PAGE_H - 420,
          size: 11,
          font: timesItalic,
          color: rgb(0.122, 0.165, 0.188),
          maxWidth: PAGE_W - 120,
          lineHeight: 16,
        });
      }

      // Bottom Logo & Footer
      try {
        const logoRes = await fetch('/logo.png');
        if (logoRes.ok) {
          const lBuf = await logoRes.arrayBuffer();
          const lImg = await pdfDoc.embedPng(lBuf);
          page.drawImage(lImg, {
            x: 40,
            y: 35,
            width: 130,
            height: 45,
          });
        }
      } catch {}

      page.drawText('Aspire for Excellence Foundation', {
        x: PAGE_W - 200,
        y: 50,
        size: 9,
        font: helveticaBold,
        color: rgb(0.961, 0.651, 0.137),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Aspire_Fellow_${alumni.first_name}_${alumni.surname}_Portrait.pdf`;
      a.click();

      setDownloadSuccess('PDF card downloaded successfully.');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-brand-gold fill-brand-gold" />
            <h3 className="font-serif-title font-bold text-xl text-brand-charcoal">
              Social Portrait Card
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-brand-charcoal/70">
          Share your fellowship recognition card on WhatsApp status or LinkedIn.
        </p>

        {downloadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Live Card Preview */}
        <div 
          ref={cardRef}
          className="bg-gradient-to-b from-brand-teal to-[#0A5054] p-4 rounded-2xl border-2 border-brand-gold text-center relative shadow-md text-brand-charcoal space-y-3"
        >
          <div className="bg-brand-cream rounded-xl p-4 space-y-2">
            <span className="cohort-badge text-[10px] bg-brand-teal text-white px-2.5 py-0.5 rounded-full inline-block">
              COHORT {alumni.cohort_year} FELLOW
            </span>

            <div className="py-1">
              <img
                src={alumni.photo_key ? `/api/photo/${alumni.photo_key}` : `/api/photo/${alumni.id}.jpg`}
                alt={alumni.first_name}
                className="w-24 h-24 rounded-full mx-auto object-cover border-3 border-brand-gold shadow-sm bg-white"
              />
            </div>

            <h4 className="font-serif-title font-bold text-lg text-brand-charcoal leading-tight">
              {alumni.first_name} {alumni.surname}
            </h4>

            <p className="text-[11px] font-bold text-brand-orange uppercase">
              {alumni.industry}
            </p>

            {alumni.advice && (
              <p className="font-serif-title text-xs italic text-brand-charcoal/80 line-clamp-2 px-2">
                "{alumni.advice}"
              </p>
            )}
          </div>

          {/* Bottom Logo & Foundation branding */}
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="bg-white px-2 py-1 rounded-md">
              <img src="/logo.png" alt="Logo" className="h-4 w-auto" />
            </div>
            <span className="text-[10px] font-bold text-brand-gold">
              Aspire for Excellence
            </span>
          </div>
        </div>

        {/* Download Buttons (PDF and PNG as required by Blueprint) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={downloadingPng}
            className="py-3 px-4 rounded-2xl bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
          >
            {downloadingPng ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
            Download PNG (WhatsApp)
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="py-3 px-4 rounded-2xl border border-brand-teal text-brand-teal hover:bg-brand-teal-tint font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {downloadingPdf ? (
              <span className="w-3.5 h-3.5 border-2 border-brand-teal border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};
