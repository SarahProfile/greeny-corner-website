'use client';

import { useState, useRef, useCallback } from 'react';
import Script from 'next/script';
import Header from '@/components/Header';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Greeny Corner Plant Identifier',
  url: 'https://www.greenycorner.ae/plant-identifier',
  description: 'Free AI-powered plant identification tool. Upload a photo to instantly identify any plant and get care tips, watering schedules, and health advice.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'AED' },
  featureList: ['AI plant identification', 'Disease detection', 'Care advice', 'Watering schedule'],
};

const AI_API_URL = '/api/identify';

interface IdentifyResult {
  species: string;
  confidence: number;
  disease: string | null;
  disease_confidence: number;
  model_used: string;
  image_quality: string;
  care_advice: string | null;
  cached: boolean;
  latency_ms: number;
}

export default function PlantIdentifierPage() {
  const [preview, setPreview] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) loadFile(f);
  };

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      });
      setStream(s);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      setError('Could not access camera.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setShowCamera(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      loadFile(f);
      stopCamera();
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  const identify = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch(AI_API_URL, { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Identification failed');
      setResult(json.data);
    } catch (e: any) {
      setError(e.message || 'Failed to reach AI model.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview('');
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confidenceColor = (c: number) =>
    c >= 0.8 ? 'bg-emerald-500' : c >= 0.5 ? 'bg-yellow-400' : 'bg-red-400';

  const confidenceLabel = (c: number) =>
    c >= 0.8 ? 'High confidence' : c >= 0.5 ? 'Medium confidence' : 'Low confidence';

  const qualityBadge = (q: string) => {
    const map: Record<string, string> = {
      ok: 'bg-emerald-100 text-emerald-700',
      blurry: 'bg-yellow-100 text-yellow-700',
      too_dark: 'bg-gray-100 text-gray-700',
    };
    return map[q] || 'bg-gray-100 text-gray-700';
  };

  return (
    <>
    <Script id="plant-identifier-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      <Header />

      <main className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
        {/* Page header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
            <span className="text-4xl">🔬</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Plant Identifier</h1>
          <p className="mt-2 text-gray-500">
            Upload a plant photo and the AI model will identify the species and detect diseases.
          </p>
          <span className="inline-block mt-3 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
            Model: Species 99.88% · Disease 98.97% accuracy
          </span>
        </div>

        {/* Upload card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-100 mb-6">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
            <h2 className="text-white font-bold text-lg">Upload Plant Image</h2>
          </div>

          <div className="p-6">
            {/* Camera view */}
            {showCamera && (
              <div className="relative rounded-2xl overflow-hidden bg-black mb-4">
                <video ref={videoRef} autoPlay playsInline className="w-full h-72 object-cover" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                  <button onClick={capturePhoto}
                    className="bg-white text-gray-900 px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-gray-100 transition">
                    📸 Capture
                  </button>
                  <button onClick={stopCamera}
                    className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-red-600 transition">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Drop zone */}
            {!showCamera && (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onClick={() => !preview && fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer
                  ${dragging ? 'border-emerald-400 bg-emerald-50' : 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'}
                  ${preview ? 'cursor-default' : ''}`}
              >
                {preview ? (
                  <div className="flex flex-col items-center p-4">
                    <img src={preview} alt="Preview" className="max-h-72 rounded-xl object-contain shadow-md" />
                    <button onClick={(e) => { e.stopPropagation(); reset(); }}
                      className="mt-3 text-sm text-gray-400 hover:text-red-500 transition font-medium">
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-12 px-4 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                      <svg className="w-9 h-9 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium mb-1">Drop an image here, or click to upload</p>
                    <p className="text-gray-400 text-sm">JPG, PNG, WEBP up to 10MB</p>
                  </div>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <canvas ref={canvasRef} className="hidden" />

            {/* Action row */}
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-emerald-300 hover:bg-emerald-50 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload
              </button>
              <button
                onClick={showCamera ? stopCamera : startCamera}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-emerald-300 hover:bg-emerald-50 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {showCamera ? 'Cancel Camera' : 'Use Camera'}
              </button>
              </div>
              <button
                onClick={identify}
                disabled={!file || loading}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-bold text-white text-lg
                  bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600
                  disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing…
                  </>
                ) : (
                  <>🔍 Identify with Greeny AI</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-2xl mb-6 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-8 animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2" />
            <div className="h-3 bg-gray-200 rounded w-4/5" />
          </div>
        )}

        {/* Results card */}
        {result && !loading && (
          <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Identification Result</h2>
              <div className="flex items-center gap-2">
                {result.cached && (
                  <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">⚡ Cached</span>
                )}
                <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
                  {result.latency_ms.toFixed(0)}ms
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Species */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl">🌿</div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Species</p>
                      <p className="text-2xl font-bold text-gray-900">{result.species}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600">{(result.confidence * 100).toFixed(1)}%</p>
                    <p className="text-xs text-gray-400">{confidenceLabel(result.confidence)}</p>
                  </div>
                </div>
                {/* Confidence bar */}
                <div className="w-full bg-gray-100 rounded-full h-2.5 mt-1">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${confidenceColor(result.confidence)}`}
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* Disease */}
              <div className={`rounded-2xl p-4 ${result.disease ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{result.disease ? '🦠' : '✅'}</span>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Disease</p>
                      <p className={`font-bold text-lg ${result.disease ? 'text-red-700' : 'text-emerald-700'}`}>
                        {result.disease
                          ? result.disease.replace(/___/g, ' — ').replace(/_/g, ' ')
                          : 'No disease detected'}
                      </p>
                    </div>
                  </div>
                  {result.disease && (
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-600">{(result.disease_confidence * 100).toFixed(1)}%</p>
                      <p className="text-xs text-gray-400">confidence</p>
                    </div>
                  )}
                </div>
                {result.disease && (
                  <div className="mt-2 w-full bg-red-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-red-400 transition-all duration-700"
                      style={{ width: `${result.disease_confidence * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Model</p>
                  <p className="font-bold text-gray-700 capitalize">{result.model_used}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Image Quality</p>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full capitalize ${qualityBadge(result.image_quality)}`}>
                    {result.image_quality}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Response</p>
                  <p className="font-bold text-gray-700">{result.latency_ms.toFixed(0)}ms</p>
                </div>
              </div>

              {/* Care advice */}
              {result.care_advice && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-400 mb-1">Care Advice</p>
                  <p className="text-blue-800 text-sm leading-relaxed">{result.care_advice}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button onClick={reset}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition">
                  🔄 Test Another
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API info footer */}
        <div className="mt-8 text-center text-xs text-gray-400 space-y-1">
          <p>Powered by Greeny AI Model · <code className="bg-gray-100 px-1.5 py-0.5 rounded">/api/identify</code></p>
          <p>12 plant species · 38 disease classes · Redis-cached results</p>
        </div>
      </main>
    </div>
    </>
  );
}
