"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface FileUploadProps {
  onUpload: (url: string) => void;
  defaultUrl?: string;
  className?: string;
}

export default function FileUpload({ onUpload, defaultUrl = "", className = "" }: FileUploadProps) {
  const [preview, setPreview] = useState(defaultUrl);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const url = res.data.url;
      setPreview(url);
      onUpload(url);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview("");
    onUpload("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
          dragActive
            ? "border-web3-accent-cyan bg-web3-accent-cyan/10"
            : "border-white/10 bg-white/5 hover:border-web3-accent-cyan/50 hover:bg-white/10"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-2 text-web3-text-secondary">
            <Loader2 className="h-8 w-8 animate-spin text-web3-accent-cyan" />
            <p className="text-sm">Uploading...</p>
          </div>
        ) : preview ? (
          <div className="relative h-full w-full p-2">
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full rounded-lg object-contain max-h-[300px]"
            />
            <button
              onClick={removeImage}
              className="absolute right-4 top-4 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition-all hover:bg-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-web3-text-secondary">
            <div className="rounded-full bg-white/5 p-4">
              <Upload className="h-6 w-6 text-web3-accent-cyan" />
            </div>
            <p className="text-sm font-semibold">
              <span className="text-web3-accent-cyan">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-web3-text-muted">SVG, PNG, JPG or GIF (max. 5MB)</p>
          </div>
        )}
      </div>
    </div>
  );
}
