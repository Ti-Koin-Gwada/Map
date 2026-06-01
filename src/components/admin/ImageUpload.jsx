import { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader, ImageIcon } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient.js'

const BUCKET = 'spot-images'
const MAX_MB  = 5

function generatePath(file) {
  const ext  = file.name.split('.').pop()
  const rand = Math.random().toString(36).slice(2, 9)
  return `${Date.now()}-${rand}.${ext}`
}

export default function ImageUpload({ value, onChange }) {
  const [dragging,    setDragging]    = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [progress,    setProgress]    = useState(0)
  const [error,       setError]       = useState(null)
  const inputRef = useRef(null)

  const upload = useCallback(async (file) => {
    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('Seules les images sont acceptées.')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Taille max : ${MAX_MB} Mo.`)
      return
    }

    setUploading(true)
    setProgress(10)

    const path = generatePath(file)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      setError('Erreur lors de l\'upload.')
      setUploading(false)
      setProgress(0)
      return
    }

    setProgress(90)
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
    setProgress(0)
  }, [onChange])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }, [upload])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)
  const handleFileChange = (e) => { const f = e.target.files[0]; if (f) upload(f) }
  const handleRemove = () => { onChange(''); setError(null) }

  // Prévisualisation si une image est déjà définie
  if (value && !uploading) {
    return (
      <div className="relative rounded-xl overflow-hidden" style={{ height: 160, border: '1.5px solid var(--color-border-mid)' }}>
        <img src={value} alt="Aperçu" className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 shadow transition-colors hover:bg-white"
        >
          <X size={14} color="var(--color-forest-dark)" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Zone de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && inputRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-2 rounded-xl transition-all"
        style={{
          height: 130,
          border: `2px dashed ${dragging ? 'var(--color-forest)' : 'var(--color-border-mid)'}`,
          background: dragging ? 'rgba(45,90,61,0.04)' : 'var(--color-bg)',
          cursor: uploading ? 'default' : 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        {uploading ? (
          <>
            <Loader size={22} className="animate-spin" style={{ color: 'var(--color-forest)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Upload en cours…
            </p>
            {/* Barre de progression */}
            <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden" style={{ background: 'var(--color-border)' }}>
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${progress}%`, background: 'var(--color-forest)' }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-border)' }}>
              {dragging ? <ImageIcon size={18} style={{ color: 'var(--color-forest)' }} /> : <Upload size={18} style={{ color: 'var(--color-text-muted)' }} />}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: dragging ? 'var(--color-forest)' : 'var(--color-text-primary)' }}>
                {dragging ? 'Déposer ici' : 'Glisser une photo ici'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                ou cliquer pour choisir · JPG, PNG, WebP · max {MAX_MB} Mo
              </p>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Input caché */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
