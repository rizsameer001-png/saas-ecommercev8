// CloudinaryUpload.jsx
// Reusable Cloudinary signed-upload component
// Usage: <CloudinaryUpload folder="products" onUploaded={({url, publicId}) => ...} />
import { useState, useRef } from 'react'
import api from '../../api/axios'
import { Upload, X, Loader, CheckCircle, Image as ImageIcon, Video } from 'lucide-react'
import toast from 'react-hot-toast'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

/**
 * Get a signed upload signature from backend then POST directly to Cloudinary.
 * Falls back to local /upload/images if VITE_CLOUDINARY_CLOUD_NAME is not set.
 */
async function uploadToCloudinary(file, folder = 'products', resourceType = 'image') {
  if (!CLOUD_NAME) {
    // Fallback to local upload
    const fd = new FormData()
    fd.append(resourceType === 'video' ? 'video' : 'image', file)
    const endpoint = resourceType === 'video' ? '/upload/video' : '/upload/image'
    const { data } = await api.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    return { url: data.url, publicId: data.filename, source: 'local' }
  }

  // Get signed signature from backend
  const sigRes = await api.post('/admin-ext/cloudinary/sign', {
    folder,
    resource_type: resourceType,
  })
  const { signature, apiKey, cloudName, timestamp, uploadPreset } = sigRes.data.data

  // Build multipart form for Cloudinary
  const fd = new FormData()
  fd.append('file', file)
  fd.append('api_key', apiKey)
  fd.append('timestamp', timestamp)
  fd.append('signature', signature)
  fd.append('folder', folder)
  if (uploadPreset) fd.append('upload_preset', uploadPreset)

  const cloudUrl = `https://api.cloudinary.com/v1_1/${cloudName || CLOUD_NAME}/${resourceType}/upload`
  const response = await fetch(cloudUrl, { method: 'POST', body: fd })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'Cloudinary upload failed')
  }
  const result = await response.json()
  return {
    url:       result.secure_url,
    publicId:  result.public_id,
    width:     result.width,
    height:    result.height,
    format:    result.format,
    source:    'cloudinary',
  }
}

// ─── Single image/video uploader ─────────────────────────────────────────────
export function CloudinaryUploadButton({ folder = 'general', accept = 'image/*', resourceType = 'image', onUploaded, label = 'Upload Image', className = '' }) {
  const [loading, setLoading] = useState(false)
  const ref = useRef()

  const handle = async (file) => {
    if (!file) return
    setLoading(true)
    try {
      const result = await uploadToCloudinary(file, folder, resourceType)
      onUploaded(result)
      toast.success(`${resourceType === 'video' ? 'Video' : 'Image'} uploaded!`)
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally { setLoading(false) }
  }

  return (
    <button type="button" onClick={() => ref.current?.click()}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-xl text-sm text-gray-600 hover:text-indigo-600 transition-all disabled:opacity-50 ${className}`}>
      {loading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
      {loading ? 'Uploading…' : label}
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={e => e.target.files[0] && handle(e.target.files[0])} />
    </button>
  )
}

// ─── Multi-image gallery uploader ────────────────────────────────────────────
export function CloudinaryImageGallery({ images = [], onChange, folder = 'products' }) {
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [urlInput,  setUrlInput]  = useState('')
  const inputRef = useRef()

  const handleFiles = async (files) => {
    if (!files?.length) return
    setUploading(true); setProgress(0)
    const newImgs = []
    const total = Math.min(files.length, 10)
    for (let i = 0; i < total; i++) {
      try {
        const result = await uploadToCloudinary(files[i], folder, 'image')
        newImgs.push({ url: result.url, publicId: result.publicId, isPrimary: images.length === 0 && newImgs.length === 0, alt: '', width: result.width, height: result.height })
        setProgress(Math.round(((i + 1) / total) * 100))
      } catch (err) {
        toast.error(`Failed: ${files[i].name}`)
      }
    }
    if (newImgs.length) onChange([...images, ...newImgs])
    toast.success(`${newImgs.length} image${newImgs.length !== 1 ? 's' : ''} uploaded`)
    setUploading(false); setProgress(0)
  }

  const addUrl = () => {
    if (!urlInput.trim()) return
    onChange([...images, { url: urlInput.trim(), isPrimary: images.length === 0, alt: '', publicId: '' }])
    setUrlInput('')
  }

  const setPrimary = (i) => onChange(images.map((img, j) => ({ ...img, isPrimary: j === i })))
  const remove = async (i) => {
    const img = images[i]
    // Delete from Cloudinary if publicId exists
    if (img.publicId && CLOUD_NAME) {
      try { await api.post('/admin-ext/cloudinary/delete', { publicId: img.publicId }) } catch {}
    }
    onChange(images.filter((_, j) => j !== i))
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          uploading ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'
        }`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        onDragOver={e => e.preventDefault()}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => handleFiles(e.target.files)} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader size={24} className="text-indigo-500 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-indigo-600">Uploading… {progress}%</p>
            <div className="w-32 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            {CLOUD_NAME && <p className="text-xs text-gray-400">Direct to Cloudinary CDN</p>}
          </div>
        ) : (
          <>
            <ImageIcon size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">Drop images or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">
              {CLOUD_NAME ? '☁️ Cloudinary CDN' : '💾 Local storage'} · PNG, JPG, WebP · Max 10MB · Up to 10
            </p>
          </>
        )}
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl() } }}
          placeholder="Or paste image URL (Cloudinary, CDN, etc.)…"
          className="input flex-1 text-sm" />
        <button type="button" onClick={addUrl}
          className="px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 text-sm font-semibold transition-colors">
          Add
        </button>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
          {images.map((img, i) => (
            <div key={i}
              className={`relative group aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                img.isPrimary ? 'border-indigo-500 shadow-md' : 'border-gray-100 hover:border-gray-300'
              }`}
              onClick={() => setPrimary(i)}>
              <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover"
                onError={e => { e.target.src = 'https://placehold.co/120?text=Error' }} />
              {img.isPrimary && (
                <div className="absolute top-1 left-1 bg-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <CheckCircle size={8} /> Primary
                </div>
              )}
              {img.publicId && (
                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[8px] px-1 py-0.5 rounded">☁️</div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button type="button" onClick={e => { e.stopPropagation(); remove(i) }}
                  className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600">
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {images.length > 0 && (
        <p className="text-xs text-gray-400">Click an image to set it as primary. Hover to remove.</p>
      )}
    </div>
  )
}

export default CloudinaryImageGallery
