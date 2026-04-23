import { useState, useRef, useCallback } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

/**
 * Hook for Cloudinary signed direct uploads.
 * Falls back to local /upload/images if Cloudinary not configured.
 */
export function useCloudinaryUpload({ folder = 'saasstore/products', onSuccess } = {}) {
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)

  const upload = useCallback(async (files) => {
    if (!files?.length) return []
    setUploading(true)
    setProgress(0)

    const results = []
    try {
      // Get signed upload params from server
      let signedParams = null
      try {
        const { data } = await api.post('/admin-ext/cloudinary/sign', { folder })
        signedParams = data
      } catch {
        // Cloudinary not configured — use local upload
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setProgress(Math.round(((i) / files.length) * 100))

        if (signedParams) {
          // Direct Cloudinary upload
          const fd = new FormData()
          fd.append('file',       file)
          fd.append('api_key',    signedParams.apiKey)
          fd.append('timestamp',  signedParams.timestamp)
          fd.append('signature',  signedParams.signature)
          fd.append('folder',     signedParams.folder)

          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${signedParams.cloudName}/image/upload`,
            { method: 'POST', body: fd }
          )
          if (!res.ok) throw new Error('Cloudinary upload failed')
          const data = await res.json()
          results.push({
            url:       data.secure_url,
            publicId:  data.public_id,
            width:     data.width,
            height:    data.height,
            format:    data.format,
            source:    'cloudinary',
            isPrimary: results.length === 0,
            alt:       file.name.replace(/\.[^/.]+$/, ''),
          })
        } else {
          // Fallback: local server upload
          const fd = new FormData()
          fd.append('images', file)
          const { data } = await api.post('/upload/images', fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          if (data.files?.[0]) {
            results.push({
              url:      data.files[0].url,
              publicId: null,
              source:   'local',
              isPrimary: results.length === 0,
              alt:      file.name.replace(/\.[^/.]+$/, ''),
            })
          }
        }
      }

      setProgress(100)
      if (onSuccess) onSuccess(results)
      return results
    } catch (err) {
      toast.error(err.message || 'Upload failed')
      return []
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }, [folder, onSuccess])

  const deleteAsset = useCallback(async (publicId) => {
    if (!publicId) return
    try {
      await api.post('/admin-ext/cloudinary/delete', { publicId })
    } catch { /* ignore delete errors */ }
  }, [])

  return { upload, uploading, progress, deleteAsset }
}

/**
 * Reusable image upload zone component (uses Cloudinary hook internally).
 * Props:
 *   images:     array of image objects { url, publicId, isPrimary, alt }
 *   onChange:   (newImages) => void
 *   folder:     cloudinary folder
 *   maxImages:  default 10
 */
export default function CloudinaryImageUpload({ images = [], onChange, folder = 'saasstore/products', maxImages = 10 }) {
  const inputRef = useRef()
  const [urlInput, setUrlInput] = useState('')
  const [dragging, setDragging] = useState(false)

  const { upload, uploading, progress } = useCloudinaryUpload({
    folder,
    onSuccess: (newImgs) => {
      const updatedImages = [...images, ...newImgs].map((img, i) => ({
        ...img,
        isPrimary: i === 0 && !images.some(im => im.isPrimary),
      }))
      onChange(updatedImages)
      toast.success(`${newImgs.length} image${newImgs.length !== 1 ? 's' : ''} uploaded`)
    }
  })

  const handleFiles = (files) => {
    const remaining = maxImages - images.length
    const toUpload  = Array.from(files).slice(0, remaining)
    if (!toUpload.length) return toast.error(`Maximum ${maxImages} images allowed`)
    upload(toUpload)
  }

  const addUrl = () => {
    if (!urlInput.trim()) return
    const newImg = { url: urlInput.trim(), publicId: null, isPrimary: images.length === 0, alt: '', source: 'url' }
    onChange([...images, newImg])
    setUrlInput('')
  }

  const setPrimary = (idx) => onChange(images.map((img, i) => ({ ...img, isPrimary: i === idx })))

  const remove = (idx) => {
    const toRemove = images[idx]
    // If Cloudinary hosted, delete from CDN
    if (toRemove.publicId && toRemove.source === 'cloudinary') {
      api.post('/admin-ext/cloudinary/delete', { publicId: toRemove.publicId }).catch(() => {})
    }
    onChange(images.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
          dragging ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'
        }`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => handleFiles(e.target.files)} />
        {uploading ? (
          <div className="space-y-2">
            <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-indigo-600">Uploading…</p>
            {progress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-xs mx-auto overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {dragging ? 'Drop to upload' : 'Drop images here or click to browse'}
            </p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP · Max 10 MB · Up to {maxImages} images</p>
            <p className="text-xs text-indigo-500 mt-1 font-medium">
              {process.env.REACT_APP_CLOUDINARY_CLOUD_NAME ? '☁ Direct Cloudinary upload' : '💾 Local server upload'}
            </p>
          </>
        )}
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl() } }}
          placeholder="Or paste Cloudinary URL / any image URL…"
          className="input flex-1 text-sm"
        />
        <button type="button" onClick={addUrl}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-600 transition-colors flex-shrink-0">
          Add
        </button>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
          {images.map((img, i) => (
            <div key={i}
              className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                img.isPrimary ? 'border-indigo-500 shadow-md' : 'border-gray-100 hover:border-gray-300'
              }`}>
              <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://placehold.co/120?text=Error' }} />

              {img.isPrimary && (
                <div className="absolute top-1 left-1 bg-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                  Primary
                </div>
              )}

              {/* Cloudinary badge */}
              {img.source === 'cloudinary' && (
                <div className="absolute bottom-1 right-1 bg-black/40 text-white text-[8px] px-1 py-0.5 rounded">CDN</div>
              )}

              {/* Hover controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                {!img.isPrimary && (
                  <button type="button" onClick={() => setPrimary(i)}
                    className="bg-white text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-lg shadow hover:bg-indigo-50 transition-colors">
                    Set Primary
                  </button>
                )}
                <button type="button" onClick={() => remove(i)}
                  className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors">
                  ×
                </button>
              </div>
            </div>
          ))}

          {/* Add more placeholder */}
          {images.length < maxImages && (
            <button type="button" onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 flex items-center justify-center text-gray-300 hover:text-indigo-400 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
