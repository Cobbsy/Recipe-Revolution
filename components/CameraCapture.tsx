import React, { useState, useEffect, useRef } from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { XIcon } from './icons/XIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface CameraCaptureProps {
  onCapture: (imageData: { data: string; mimeType: string }) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
                setError('Camera permission denied. Please allow camera access in your browser settings.');
            } else {
                 setError(`Could not access camera: ${err.message}`);
            }
        } else {
            setError('An unknown error occurred while accessing the camera.');
        }
      } finally {
          setIsLoading(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageDataUrl);
        
        // Stop the stream after capture
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    }
  };
  
  const handleRetake = () => {
    setCapturedImage(null);
    setIsLoading(true);
    // Restart the camera stream
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        // Error handling as in initial load
      } finally {
          setIsLoading(false);
      }
    };
    startCamera();
  };
  
  const handleUsePhoto = () => {
    if (capturedImage) {
        const [meta, base64Data] = capturedImage.split(',');
        if (!base64Data) {
          setError('Invalid image format captured.');
          return;
        }
        const mimeTypeMatch = meta.match(/:(.*?);/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
        onCapture({ data: base64Data, mimeType });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4" aria-modal="true" role="dialog">
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-20" aria-label="Close camera">
        <XIcon className="w-8 h-8" />
      </button>

      <div className="relative w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
                <SpinnerIcon className="w-12 h-12 text-white/50" />
            </div>
        )}
        {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <p className="text-white font-semibold">{error}</p>
                <button onClick={onClose} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg">Close</button>
            </div>
        )}
        
        <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-contain transition-opacity duration-300 ${stream && !capturedImage ? 'opacity-100' : 'opacity-0'}`}
            onCanPlay={() => setIsLoading(false)}
        />

        {capturedImage && (
            <img src={capturedImage} alt="Captured recipe" className="absolute inset-0 w-full h-full object-contain" />
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="mt-6">
        {capturedImage ? (
            <div className="flex gap-4">
                <button onClick={handleRetake} className="px-6 py-3 bg-white/20 text-white font-bold rounded-full hover:bg-white/30 transition-colors">
                    Retake
                </button>
                 <button onClick={handleUsePhoto} className="px-6 py-3 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-colors">
                    Use Photo
                </button>
            </div>
        ) : (
            <button
                onClick={handleCapture}
                disabled={!stream || isLoading}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-black/20 disabled:opacity-50"
                aria-label="Take photo"
            >
                <div className="w-16 h-16 rounded-full bg-white/80 active:bg-orange-400 transition-colors"></div>
            </button>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;