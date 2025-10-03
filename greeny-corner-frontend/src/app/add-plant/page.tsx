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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera on mobile
        } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      setError(t('addPlant.cameraError'));
    }
  }, []);

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
      await plantsAPI.addPlant(selectedFile, i18n.language);
      router.push('/my-plants');
    } catch (err: any) {
      setError(err.response?.data?.message || t('addPlant.failedToAdd'));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-green-50">
      <Header />

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/my-plants"
              className="text-green-600 hover:text-green-500 font-medium"
            >
              {t('addPlant.backToMyPlants')}
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">{t('addPlant.addNewPlant')}</h2>
              <p className="mt-1 text-sm text-gray-600">
                {t('addPlant.description')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('addPlant.plantPhoto')}
                </label>
                
                {/* Mode Selection */}
                <div className="mb-4 flex space-x-4">
                  <button
                    type="button"
                    onClick={switchToCamera}
                    className={`flex items-center px-4 py-2 rounded-md ${
                      captureMode === 'camera' 
                        ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t('addPlant.takePhoto')}
                  </button>
                  <button
                    type="button"
                    onClick={switchToUpload}
                    className={`flex items-center px-4 py-2 rounded-md ${
                      captureMode === 'upload' 
                        ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {t('addPlant.uploadFile')}
                  </button>
                </div>

                {/* Camera Mode */}
                {captureMode === 'camera' && (
                  <div className="space-y-4">
                    {showCamera && !preview && (
                      <div className="relative">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-64 object-cover rounded-lg bg-black"
                        />
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="bg-white text-gray-900 px-6 py-3 rounded-full hover:bg-gray-100 font-medium shadow-lg"
                          >
                            {t('addPlant.capture')}
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 font-medium shadow-lg"
                          >
                            {t('addPlant.cancel')}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {!showCamera && !preview && (
                      <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="mt-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
                          >
                            {t('addPlant.startCamera')}
                          </button>
                          <p className="mt-2 text-xs text-gray-500">{t('addPlant.clickToTakePhoto')}</p>
                        </div>
                      </div>
                    )}
                    
                    {preview && (
                      <div className="text-center">
                        <img
                          src={preview}
                          alt="Captured photo"
                          className="mx-auto h-64 object-cover rounded-lg"
                        />
                        <div className="mt-4 flex justify-center space-x-4">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                          >
                            {t('addPlant.retake')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Mode */}
                {captureMode === 'upload' && (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-green-400 transition-colors">
                    <div className="space-y-1 text-center">
                      {preview ? (
                        <div className="mb-4">
                          <img
                            src={preview}
                            alt="Preview"
                            className="mx-auto h-32 w-32 object-cover rounded-lg"
                          />
                        </div>
                      ) : (
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
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
                      )}
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
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
                        {!preview && <p className="pl-1">{t('addPlant.orDragAndDrop')}</p>}
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

              <div className="flex justify-end space-x-3">
                <Link
                  href="/my-plants"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {t('addPlant.cancel')}
                </Link>
                <button
                  type="submit"
                  disabled={loading || !selectedFile}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('addPlant.identifyingPlant')}
                    </>
                  ) : (
                    t('addPlant.addPlant')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}