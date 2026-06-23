import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const A4 = { w: 210, h: 297 }; // mm

export async function exportAsPDF(element, filename = 'RASF_Report.pdf') {
  if (!element) throw new Error('No element to capture');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#090d1a',
    logging: false,
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const imgWidthMm    = A4.w;
  const totalHeightMm = (canvas.height * A4.w) / canvas.width;
  const totalPages    = Math.ceil(totalHeightMm / A4.h);
  const pageHeightPx  = Math.round((A4.h / totalHeightMm) * canvas.height);

  for (let i = 0; i < totalPages; i++) {
    if (i > 0) pdf.addPage();

    const srcY        = i * pageHeightPx;
    const sliceHeight = Math.min(pageHeightPx, canvas.height - srcY);
    if (sliceHeight <= 0) break;

    const slice = document.createElement('canvas');
    slice.width  = canvas.width;
    slice.height = sliceHeight;
    slice.getContext('2d').drawImage(
      canvas,
      0, srcY, canvas.width, sliceHeight,
      0, 0,  canvas.width, sliceHeight,
    );

    const sliceHeightMm = (sliceHeight / canvas.height) * totalHeightMm;
    pdf.addImage(slice.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, imgWidthMm, sliceHeightMm);
  }

  pdf.save(filename);
}
