import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (content: string) => void;
  accept?: string;
  label?: string;
}

export function FileUpload({ onFileSelect, accept = ".txt,.pdf,.doc,.docx", label = "拖拽脚本文件至此 或 点击上传" }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const processFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        onFileSelect(content);
      }
    };
    reader.readAsText(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, []);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`
        relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-3
        ${isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'}
        ${fileName ? 'bg-accent/5 py-4' : ''}
      `}
    >
      <input 
        type="file" 
        className="absolute inset-0 opacity-0 cursor-pointer" 
        onChange={onSelect}
        accept={accept}
      />
      
      {fileName ? (
        <div className="flex items-center gap-3 w-full animate-in fade-in zoom-in duration-300">
          <div className="w-10 h-10 bg-accent/20 rounded flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-mono truncate">{fileName}</p>
            <p className="text-[10px] text-ink-muted uppercase">解析就绪</p>
          </div>
          <button 
            className="p-1 hover:bg-red-500/20 rounded text-ink-muted hover:text-red-500 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setFileName(null);
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="w-12 h-12 bg-panel rounded-full flex items-center justify-center border border-border">
            <Upload className="w-6 h-6 text-ink-muted" />
          </div>
          <p className="text-xs font-mono text-ink-muted uppercase text-center">
            {label}
          </p>
        </>
      )}
    </div>
  );
}
