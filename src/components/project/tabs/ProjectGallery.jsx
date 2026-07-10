import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp }  from '../../../contexts/useApp';
import { useAuth } from '../../../contexts/useAuth';
import { FileCategory } from '../../../models/FileDocument';
import { ActivityService } from '../../../services/ActivityService';
import { Loader, ImagePlus, Trash2, ChevronLeft, ChevronRight, X, Download } from 'lucide-react';

// معرض صور المشروع — يعيد استخدام تخزين الملفات (bucket project-files) بفئة "img"
export default function ProjectGallery({ project }) {
  const { fileService } = useApp();
  const { profile, isDepAdmin } = useAuth();
  const [images,    setImages]    = useState([]);
  const [urls,      setUrls]      = useState({});   // id → signed url (للمصغّرات والعرض)
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);  // فهرس الصورة المفتوحة أو null
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const inputRef = useRef(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    const all  = await fileService.getByProject(project.id);
    const imgs = all.filter(f => f.category === FileCategory.IMAGES);
    setImages(imgs);
    const entries = await Promise.all(
      imgs.map(async f => {
        try { return [f.id, await fileService.getSignedUrl(f.storagePath)]; }
        catch { return [f.id, null]; }
      })
    );
    setUrls(Object.fromEntries(entries));
    setLoading(false);
  }, [fileService, project.id]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  // التنقّل بين الصور (يلتفّ دائرياً). في RTL: السابق يمين، التالي يسار.
  const go = useCallback((delta) => {
    setLightboxIdx(i => (i === null ? i : (i + delta + images.length) % images.length));
  }, [images.length]);

  // أسهم لوحة المفاتيح + Escape عند فتح العارض
  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape')          setLightboxIdx(null);
      else if (e.key === 'ArrowRight') go(-1);   // يمين = السابق (RTL)
      else if (e.key === 'ArrowLeft')  go(1);    // يسار = التالي (RTL)
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, go]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        await fileService.upload(file, project.id, project.name, FileCategory.IMAGES, profile);
      }
      ActivityService.log(profile, files.length > 1 ? `إضافة ${files.length} صور` : 'إضافة صورة', { entityType: 'image', entityName: project.name, projectId: project.id });
      await fetchImages();
    } catch (err) {
      console.error('[Gallery] upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (img) => {
    try {
      await fileService.delete(img.id, img.storagePath, profile);
      ActivityService.log(profile, 'حذف صورة', { entityType: 'image', entityName: project.name, projectId: project.id });
      setImages(prev => prev.filter(i => i.id !== img.id));
    } catch (err) {
      console.error('[Gallery] delete failed', err);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const current = lightboxIdx !== null ? images[lightboxIdx] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Upload zone */}
      <div
        className="upload-zone p-8 text-center"
        onClick={() => !uploading && inputRef.current?.click()}
        style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}
      >
        <input ref={inputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
        {uploading
          ? <Loader size={36} style={{ marginBottom: 8, animation: 'spin 1s linear infinite', color: 'var(--rasf-primary)' }} />
          : <ImagePlus size={36} style={{ marginBottom: 8, color: 'var(--rasf-primary)' }} />
        }
        <div style={{ fontWeight: 700, color: 'var(--text-hi)', marginBottom: 4 }}>
          {uploading ? 'جارٍ الرفع...' : 'اسحب الصور هنا أو اضغط للرفع'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PNG, JPG, WEBP — تقدر تختار أكثر من صورة</div>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader size={26} style={{ animation: 'spin 1s linear infinite', color: 'var(--rasf-primary)' }} />
        </div>
      )}

      {!loading && images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {images.map((img, idx) => (
            <div
              key={img.id}
              style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '1 / 1', background: 'var(--bg-card-strong)' }}
            >
              {urls[img.id] ? (
                <img
                  src={urls[img.id]}
                  alt={img.name}
                  onClick={() => setLightboxIdx(idx)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block' }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-faint)', fontSize: 24 }}>🖼️</div>
              )}

              {isDepAdmin && (
                confirmDeleteId === img.id ? (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#fff' }}>حذف الصورة؟</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleDelete(img)} style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 7, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer' }}>نعم</button>
                      <button onClick={() => setConfirmDeleteId(null)} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', cursor: 'pointer' }}>لا</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(img.id)}
                    title="حذف"
                    style={{ position: 'absolute', top: 6, insetInlineEnd: 6, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 7, padding: 5, color: '#fff', cursor: 'pointer', display: 'flex' }}
                  >
                    <Trash2 size={13} />
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && images.length === 0 && !uploading && (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-faint)', fontSize: 13 }}>
          لا توجد صور لهذا المشروع بعد
        </div>
      )}

      {/* Lightbox مع التنقّل بين الصور */}
      {current && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setLightboxIdx(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          {/* Top bar: counter + download + close */}
          <div style={{ position: 'absolute', top: 16, insetInlineStart: 20, insetInlineEnd: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{lightboxIdx + 1} / {images.length}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {urls[current.id] && (
                <a
                  href={urls[current.id]} download={current.name}
                  onClick={e => e.stopPropagation()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
                >
                  <Download size={13} /> تنزيل
                </a>
              )}
              <button onClick={() => setLightboxIdx(null)} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Previous (right side in RTL) */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              title="السابق"
              style={{ position: 'absolute', insetInlineStart: 16, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ChevronRight size={26} />
            </button>
          )}

          <img
            src={urls[current.id]}
            alt={current.name}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain', borderRadius: 8 }}
          />

          {/* Next (left side in RTL) */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); go(1); }}
              title="التالي"
              style={{ position: 'absolute', insetInlineEnd: 16, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ChevronLeft size={26} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
