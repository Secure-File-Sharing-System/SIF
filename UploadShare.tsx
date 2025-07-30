import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, File, CheckCircle, Eye, EyeOff, X } from 'lucide-react';

interface UploadedFile {
    name: string;
    size: number;
    id: string;
    expiresAt: string;
}

const UploadShare: React.FC = () => {
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [error, setError] = useState<string>('');
    const [shareLink, setShareLink] = useState<string>('');
    const [copySuccess, setCopySuccess] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [expiresIn, setExpiresIn] = useState('24h');
    const [isPublic, setIsPublic] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const API_BASE_URL = import.meta.env.MODE === 'production'
        ? 'https://your-backend-url.com'
        : 'http://localhost:5000';

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleFiles = async (files: FileList) => {
        const file = files[0];
        if (!file) return;

        setError('');
        setUploadedFile(null);
        setShareLink('');
        setCopySuccess(false);

        if (file.size > 100 * 1024 * 1024) {
            setError('File size exceeds 100MB limit');
            return;
        }

        await uploadFile(file);
    };

    const uploadFile = useCallback(async (file: File) => {
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('expiresIn', expiresIn);
            formData.append('isPublic', isPublic.toString());

            if (password.trim()) {
                formData.append('password', password);
            }

            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(progress);
                }
            });

            xhr.addEventListener('load', () => {
                setIsUploading(false);
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    setUploadedFile({
                        name: file.name,
                        size: file.size,
                        id: response.fileId,
                        expiresAt: response.expiresAt
                    });
                    setShareLink(`${window.location.origin}/files/${response.fileId}`);
                    setUploadProgress(100);
                } else {
                    const errorResponse = JSON.parse(xhr.responseText);
                    setError(errorResponse.error || 'Upload failed');
                    setUploadProgress(0);
                }
            });

            xhr.addEventListener('error', () => {
                setError('Upload failed. Please try again.');
                setIsUploading(false);
                setUploadProgress(0);
            });

            xhr.open('POST', `${API_BASE_URL}/api/upload`);
            xhr.send(formData);

        } catch {
            setError('Upload failed. Please try again.');
            setIsUploading(false);
            setUploadProgress(0);
        }
    }, [expiresIn, isPublic, password, API_BASE_URL]);

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const resetUpload = () => {
        setUploadedFile(null);
        setShareLink('');
        setError('');
        setUploadProgress(0);
        setCopySuccess(false);
        setPassword('');
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6">
            <div className="flex items-center justify-between border-b border-gray-700 pb-6 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Upload & Share</h1>
                    <p className="text-gray-400 mt-1">Share files with ease and security.</p>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-2xl">
                    {!uploadedFile && !isUploading && (
                        <>
                             <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Expires in</label>
                                    <select
                                      value={expiresIn}
                                      onChange={(e) => setExpiresIn(e.target.value)}
                                      className="input-field"
                                    >
                                      <option value="24h">24 hours</option>
                                      <option value="7d">7 days</option>
                                      <option value="30d">30 days</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Visibility</label>
                                    <select
                                      value={isPublic ? 'public' : 'private'}
                                      onChange={(e) => setIsPublic(e.target.value === 'public')}
                                      className="input-field"
                                    >
                                      <option value="public">Public</option>
                                      <option value="private">Private</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Password (Optional)</label>
                                    <div className="relative">
                                      <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter password"
                                        className="input-field pr-10"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                      >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-300 ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'}`}
                            >
                                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-4 text-lg font-medium text-white">Drag & drop files or click to browse</h3>
                                <p className="mt-1 text-sm text-gray-400">Max file size: 100MB</p>
                                <button onClick={handleFileSelect} className="mt-6 btn-primary">
                                    Choose File
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                                />
                            </div>
                        </>
                    )}

                    {isUploading && (
                        <div className="w-full text-center">
                             <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UploadCloud className="w-8 h-8 text-gray-400 animate-pulse" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Uploading...</h3>
                            <p className="text-gray-400 mb-6">Your file is being uploaded. Please wait.</p>
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                            <p className="mt-2 text-sm text-gray-400">{uploadProgress}%</p>
                        </div>
                    )}

                    {uploadedFile && !isUploading && (
                        <div className="text-center">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                            <h3 className="mt-4 text-lg font-medium text-white">Upload Successful</h3>
                            <p className="mt-1 text-sm text-gray-400">Your file has been uploaded and is ready to share.</p>

                            <div className="mt-6 bg-gray-800 rounded-lg p-4 text-left">
                                <div className="flex items-center">
                                    <File className="h-6 w-6 text-gray-400 mr-3" />
                                    <div>
                                        <p className="font-medium text-white truncate">{uploadedFile.name}</p>
                                        <p className="text-sm text-gray-400">{formatFileSize(uploadedFile.size)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 relative">
                                <input
                                    type="text"
                                    value={shareLink}
                                    readOnly
                                    className="input-field pr-24"
                                />
                                <button onClick={copyToClipboard} className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-secondary">
                                    {copySuccess ? 'Copied!' : 'Copy Link'}
                                </button>
                            </div>

                            <button onClick={resetUpload} className="mt-6 btn-primary">
                                Upload Another File
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg relative" role="alert">
                            <strong className="font-bold">Error:</strong>
                            <span className="block sm:inline ml-2">{error}</span>
                            <button onClick={() => setError('')} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadShare;