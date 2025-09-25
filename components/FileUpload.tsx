import React, { useState, useCallback, useEffect } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { UploadIcon } from './icons/UploadIcon';
import { CameraIcon } from './icons/CameraIcon';
import CameraCapture from './CameraCapture';


type InputMode = 'paste' | 'title' | 'image' | 'camera';

interface RecipeInputProps {
  onSubmit: (data: { type: 'paste', content: string } | { type: 'title', content: string } | { type: 'image', file: File } | { type: 'camera', content: { data: string; mimeType: string }}) => void;
  disabled?: boolean;
}

const RecipeInput: React.FC<RecipeInputProps> = ({ onSubmit, disabled = false }) => {
  const [inputType, setInputType] = useState<InputMode>('paste');
  const [textContent, setTextContent] = useState<string>('');
  const [titleContent, setTitleContent] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleImageFile = useCallback((file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    } else {
      setImageFile(null);
    }
  }, []);
  
  const onDragEnter = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  }, []);
  
  const onDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
  }, []);
  
  const onDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleImageFile(e.dataTransfer.files[0]);
          e.dataTransfer.clearData();
      }
  }, [handleImageFile]);

  useEffect(() => {
    if (imageFile) {
      const objectUrl = URL.createObjectURL(imageFile);
      setImagePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setImagePreview(null);
  }, [imageFile]);

  const handleCameraCapture = (imageData: { data: string; mimeType: string }) => {
      setIsCameraOpen(false);
      onSubmit({ type: 'camera', content: imageData });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (inputType === 'paste' && textContent.trim()) {
      onSubmit({ type: 'paste', content: textContent });
    } else if (inputType === 'title' && titleContent.trim()) {
      onSubmit({ type: 'title', content: titleContent });
    } else if (inputType === 'image' && imageFile) {
      onSubmit({ type: 'image', file: imageFile });
    }
    // Note: Camera submission is handled directly by its capture callback
  };
  
  const isSubmitDisabled = disabled || 
    (inputType === 'paste' ? !textContent.trim() : 
    (inputType === 'title' ? !titleContent.trim() : 
    (inputType === 'image' ? !imageFile : 
    (inputType === 'camera' ? true : false) // Disable main button for camera
    )));

  return (
    <>
    {isCameraOpen && <CameraCapture onCapture={handleCameraCapture} onClose={() => setIsCameraOpen(false)} />}
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-center p-1 bg-gray-200/80 rounded-full dark:bg-gray-700/80">
        <button type="button" onClick={() => setInputType('paste')} className={`w-full sm:w-auto px-4 py-2 rounded-full text-sm font-semibold transition-colors ${inputType === 'paste' ? 'bg-white shadow dark:bg-gray-800' : 'text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-900/50'}`}>Paste Recipe</button>
        <button type="button" onClick={() => setInputType('title')} className={`w-full sm:w-auto px-4 py-2 rounded-full text-sm font-semibold transition-colors ${inputType === 'title' ? 'bg-white shadow dark:bg-gray-800' : 'text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-900/50'}`}>Generate by Title</button>
        <button type="button" onClick={() => setInputType('image')} className={`w-full sm:w-auto px-4 py-2 rounded-full text-sm font-semibold transition-colors ${inputType === 'image' ? 'bg-white shadow dark:bg-gray-800' : 'text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-900/50'}`}>Upload Image</button>
        <button type="button" onClick={() => setInputType('camera')} className={`w-full sm:w-auto px-4 py-2 rounded-full text-sm font-semibold transition-colors ${inputType === 'camera' ? 'bg-white shadow dark:bg-gray-800' : 'text-gray-600 hover:bg-white/50 dark:text-gray-300 dark:hover:bg-gray-900/50'}`}>Take Photo</button>
      </div>

      <div className="pt-2">
        {inputType === 'paste' && (
           <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              disabled={disabled}
              className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors duration-200 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
              placeholder="Paste the full text of your recipe here..."
              aria-label="Recipe text input"
          />
        )}
        {inputType === 'title' && (
            <input
                type="text"
                value={titleContent}
                onChange={(e) => setTitleContent(e.target.value)}
                disabled={disabled}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                placeholder="e.g., Cantonese Chow Mein"
                aria-label="Recipe title input"
            />
        )}
        {inputType === 'image' && (
          <div className="space-y-3">
            <label 
              htmlFor="image-upload" 
              onDragEnter={onDragEnter}
              onDragOver={onDragEnter}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative flex flex-col items-center justify-center w-full h-48 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-orange-400 bg-orange-50 dark:border-orange-500 dark:bg-orange-900/20' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:bg-gray-700'}`}
            >
                <div className="text-center">
                    <UploadIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, or WEBP</p>
                </div>
                <input id="image-upload" type="file" accept="image/*" className="sr-only" onChange={(e) => handleImageFile(e.target.files ? e.target.files[0] : null)} />
            </label>
            {imagePreview && (
                <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-lg dark:bg-gray-700">
                    <img src={imagePreview} alt="Recipe preview" className="w-16 h-16 object-cover rounded-md" />
                    <div className="flex-grow">
                        <p className="text-sm font-medium text-gray-800 truncate dark:text-gray-200">{imageFile?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{imageFile && `${(imageFile.size / 1024).toFixed(2)} KB`}</p>
                    </div>
                    <button type="button" onClick={() => setImageFile(null)} className="text-gray-500 hover:text-red-600 p-1 rounded-full dark:text-gray-400 dark:hover:text-red-500">&times;</button>
                </div>
            )}
          </div>
        )}
         {inputType === 'camera' && (
            <div className="flex flex-col items-center justify-center w-full h-48 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50">
                <CameraIcon className="w-12 h-12 text-gray-400 mb-4" />
                <button 
                    type="button" 
                    onClick={() => setIsCameraOpen(true)}
                    disabled={disabled}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-gray-100 border border-gray-400 text-gray-800 font-bold py-3 px-6 rounded-full shadow-sm transition-colors dark:bg-gray-600 dark:hover:bg-gray-500 dark:border-gray-500 dark:text-gray-200"
                >
                    Open Camera
                </button>
            </div>
         )}
      </div>

      {inputType !== 'camera' && (
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out"
          >
            <SparklesIcon className="w-5 h-5" />
            <span>{disabled ? 'Clipping...' : 'Clip Recipe'}</span>
          </button>
        </div>
      )}
    </form>
    </>
  );
};

export default RecipeInput;