'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { plantsAPI } from '@/lib/api';
import Header from '@/components/Header';
import { useTranslation } from 'react-i18next';

export default function AddPlantPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [captureMode, setCaptureMode] = useState<'upload' | 'camera'>('upload');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const { i18n, t } = useTranslation();

  const compressImage = (file: File, maxSizeKB: number = 1024): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1000px on longest side)
        const maxDimension = 1000;
        let { width, height } = img;

        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8 // 80% quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress large images
      const compressedFile = file.size > 1024 * 1024 ? await compressImage(file) : file;
      setSelectedFile(compressedFile);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    }
  };

  const startCamera = useCallback(async () => {
    try {
      console.log('📷 Starting camera...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      console.log('✅ Camera stream acquired');
      setCameraStream(stream);
      setShowCamera(true);

      // Set video source after state updates
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err);
          });
          console.log('✅ Video element connected to stream');
        }
      }, 100);
    } catch (err: any) {
      console.error('❌ Camera error:', err);
      setError(t('addPlant.cameraError') + ': ' + err.message);
    }
  }, [t]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  }, [cameraStream]);

  const capturePhoto = useCallback(async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0);

      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `plant-${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          // Compress the captured photo
          const compressedFile = await compressImage(file);
          setSelectedFile(compressedFile);
          setPreview(canvas.toDataURL('image/jpeg', 0.8));
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  }, [stopCamera]);

  const switchToUpload = () => {
    setCaptureMode('upload');
    stopCamera();
    setSelectedFile(null);
    setPreview('');
  };

  const switchToCamera = () => {
    setCaptureMode('camera');
    setSelectedFile(null);
    setPreview('');
    startCamera();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError(t('addPlant.selectImageError'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📤 Uploading plant image...', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        language: i18n.language
      });

      const result = await plantsAPI.addPlant(selectedFile, i18n.language);

      console.log('✅ Plant added successfully:', result);
      router.push('/my-plants');
    } catch (err: any) {
      console.error('❌ Failed to add plant:', err);
      console.error('Error response:', err.response?.data);

      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          t('addPlant.failedToAdd');

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }
      `}</style>

      <Header />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
        {/* Back Button */}
        <div className="mb-6 animate-slideUp">
          <Link
            href="/my-plants"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-semibold transition-all group"
          >
            <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('addPlant.backToMyPlants')}
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-emerald-100 animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                <span className="text-3xl">🌱</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{t('addPlant.addNewPlant')}</h2>
                <p className="mt-1 text-sm text-emerald-50">
                  {t('addPlant.description')}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6 flex items-start animate-slideUp">
                <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="mb-8">
              <label className="block text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">📸</span>
                {t('addPlant.plantPhoto')}
              </label>

              {/* Mode Selection */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={switchToCamera}
                  className={`flex items-center justify-center px-6 py-4 rounded-2xl font-semibold transition-all transform hover:-translate-y-1 ${
                    captureMode === 'camera'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-emerald-300 shadow-md'
                  }`}
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t('addPlant.takePhoto')}
                </button>
                <button
                  type="button"
                  onClick={switchToUpload}
                  className={`flex items-center justify-center px-6 py-4 rounded-2xl font-semibold transition-all transform hover:-translate-y-1 ${
                    captureMode === 'upload'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-emerald-300 shadow-md'
                  }`}
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {t('addPlant.uploadFile')}
                </button>
              </div>

              {/* Camera Mode */}
              {captureMode === 'camera' && (
                <div className="space-y-4">
                  {showCamera && !preview && (
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-96 object-cover"
                      />
                      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="bg-white text-gray-900 px-8 py-4 rounded-2xl hover:bg-gray-100 font-bold shadow-2xl transition-all transform hover:scale-105 flex items-center"
                        >
                          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          </svg>
                          {t('addPlant.capture')}
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="bg-red-500 text-white px-8 py-4 rounded-2xl hover:bg-red-600 font-bold shadow-2xl transition-all transform hover:scale-105 flex items-center"
                        >
                          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {t('addPlant.cancel')}
                        </button>
                      </div>
                    </div>
                  )}

                  {!showCamera && !preview && (
                    <div className="flex justify-center px-6 pt-12 pb-12 border-3 border-emerald-300 border-dashed rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:border-emerald-400 transition-all">
                      <div className="text-center">
                        <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-4">
                          <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 font-bold shadow-lg transition-all transform hover:-translate-y-1"
                        >
                          {t('addPlant.startCamera')}
                        </button>
                        <p className="mt-4 text-sm text-gray-600 font-medium">{t('addPlant.clickToTakePhoto')}</p>
                      </div>
                    </div>
                  )}

                  {preview && (
                    <div className="text-center">
                      <div className="relative inline-block rounded-3xl overflow-hidden shadow-2xl">
                        <img
                          src={preview}
                          alt="Captured photo"
                          className="h-96 object-cover rounded-3xl"
                        />
                      </div>
                      <div className="mt-6 flex justify-center space-x-4">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="bg-white border-2 border-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-50 font-semibold shadow-md transition-all"
                        >
                          🔄 {t('addPlant.retake')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Mode */}
              {captureMode === 'upload' && (
                <div className="flex justify-center px-6 pt-12 pb-12 border-3 border-emerald-300 border-dashed rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:border-emerald-400 transition-all cursor-pointer">
                  <div className="space-y-4 text-center w-full">
                    {preview ? (
                      <div className="mb-6">
                        <div className="relative inline-block rounded-3xl overflow-hidden shadow-2xl">
                          <img
                            src={preview}
                            alt="Preview"
                            className="max-h-96 object-cover rounded-3xl"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-4">
                        <svg
                          className="w-12 h-12 text-emerald-600"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="flex flex-col items-center text-sm text-gray-700">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 font-bold shadow-lg transition-all transform hover:-translate-y-1"
                      >
                        <span>{preview ? t('addPlant.changePhoto') : t('addPlant.uploadAFile')}</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleFileSelect}
                        />
                      </label>
                      {!preview && <p className="mt-4 text-gray-600 font-medium">{t('addPlant.orDragAndDrop')}</p>}
                    </div>
                    {!preview && (
                      <p className="text-xs text-gray-500">{t('addPlant.fileTypes')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Hidden canvas for photo capture */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-gray-100">
              <Link
                href="/my-plants"
                className="flex-1 bg-white py-4 px-6 border-2 border-gray-200 rounded-xl shadow-md text-base font-bold text-gray-700 hover:bg-gray-50 transition-all text-center"
              >
                ← {t('addPlant.cancel')}
              </Link>
              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="flex-1 inline-flex justify-center items-center py-4 px-6 border-transparent shadow-lg text-base font-bold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('addPlant.identifyingPlant')}
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {t('addPlant.addPlant')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-white rounded-3xl shadow-xl p-6 border border-blue-100 animate-slideUp" style={{animationDelay: '0.2s'}}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">💡 Tips for best results</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2 mt-0.5">✓</span>
                  <span>Take a clear photo of the plant's leaves in good lighting</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2 mt-0.5">✓</span>
                  <span>Get close enough to see leaf details and patterns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2 mt-0.5">✓</span>
                  <span>Avoid blurry or dark images for accurate identification</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
