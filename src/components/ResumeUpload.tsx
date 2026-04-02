import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { parseResume } from '../services/gemini';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { X, Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure PDF.js worker using Vite's worker loader
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function ResumeUpload({ onClose }: { onClose: () => void }) {
  const [files, setFiles] = useState<{ file: File; status: 'pending' | 'processing' | 'done' | 'error'; error?: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles.map(file => ({ file, status: 'pending' as const }))]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  const extractText = async (file: File): Promise<string> => {
    try {
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (!result.value.trim()) throw new Error('The DOCX file appears to be empty.');
        return result.value;
      } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ 
          data: arrayBuffer,
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
        });
        
        const pdf = await loadingTask.promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          text += strings.join(' ') + '\n';
        }
        
        if (!text.trim()) {
          throw new Error('Could not extract text from PDF. It might be a scanned image or encrypted.');
        }
        return text;
      }
      throw new Error('Unsupported file type. Please upload a PDF or DOCX.');
    } catch (err: any) {
      console.error('Extraction error:', err);
      throw new Error(`Failed to read file: ${err.message}`);
    }
  };

  const processFiles = async () => {
    if (!auth.currentUser) return;
    setIsProcessing(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue;

      try {
        setFiles(prev => {
          const next = [...prev];
          next[i].status = 'processing';
          return next;
        });

        const text = await extractText(files[i].file);
        const extractedData = await parseResume(text);

        const resumeRef = doc(collection(db, 'resumes'));
        await setDoc(resumeRef, {
          id: resumeRef.id,
          userId: auth.currentUser.uid,
          fileName: files[i].file.name,
          rawText: text,
          extractedData,
          createdAt: new Date().toISOString(),
        });

        setFiles(prev => {
          const next = [...prev];
          next[i].status = 'done';
          return next;
        });
      } catch (err: any) {
        console.error(err);
        setFiles(prev => {
          const next = [...prev];
          next[i].status = 'error';
          next[i].error = err.message;
          return next;
        });
      }
    }
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Upload Resumes</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-slate-900 font-medium">Drag & drop resumes here</p>
            <p className="text-slate-500 text-sm mt-1">Supports PDF and DOCX</p>
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">Files ({files.length})</h4>
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{f.file.name}</p>
                      <p className="text-xs text-slate-500">{(f.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {f.status === 'processing' && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
                    {f.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {f.status === 'error' && (
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-red-500 font-bold">Error</span>
                        <span className="text-[10px] text-red-400 max-w-[150px] truncate" title={f.error}>{f.error}</span>
                        <button 
                          onClick={() => setFiles(prev => {
                            const next = [...prev];
                            next[i].status = 'pending';
                            next[i].error = undefined;
                            return next;
                          })}
                          className="text-[10px] text-indigo-600 hover:underline mt-0.5"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={processFiles} 
            disabled={isProcessing || files.filter(f => f.status === 'pending').length === 0}
          >
            {isProcessing ? 'Processing...' : 'Start Processing'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
