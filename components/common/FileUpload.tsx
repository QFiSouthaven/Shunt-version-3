
import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon, CheckIcon } from '../icons';
import Loader from '../Loader';
import { VirtualFile } from '../../types';

interface FileUploadProps {
  onFilesUploaded: (files: Array<{ filename: string; content: string; file: File; mimeType?: string; encoding?: 'utf-8' | 'base64' }>) => void;
  acceptedFileTypes: string[];
  maxFileSizeMB: number;
  enableDirectoryUpload?: boolean;
}

const SKIPPED_EXTENSIONS = [
    // Archives not handled by JSZip (handled separately if strictly needed, but generally skipped for direct text analysis)
    '.tar', '.gz', '.rar', '.7z', '.tar.gz',
    // Executables
    '.exe', '.dll', '.so', '.dmg', '.app',
    // Office formats that are strictly binary (unless parsed)
    '.docx', '.pptx', '.xlsx',
];

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded, acceptedFileTypes, maxFileSizeMB, enableDirectoryUpload = true }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const successTimeoutRef = useRef<number | null>(null);

  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const validateFile = useCallback((name: string, size: number, type: string): string | null | 'SKIP' => {
      const filenameOnly = name.split('/').pop() || name;
      const filenameLower = filenameOnly.toLowerCase();

      // Silently skip common binary/unsupported files and macOS metadata files
      if (SKIPPED_EXTENSIONS.some(ext => filenameLower.endsWith(ext)) || filenameLower === '.ds_store') {
          return 'SKIP';
      }

      const maxSizeInBytes = maxFileSizeMB * 1024 * 1024;
      if (size > maxSizeInBytes) {
          return `'${name}' (${formatBytes(size)}) is too large. The maximum file size is ${maxFileSizeMB}MB.`;
      }
      
      // Allow any image type if acceptedFileTypes contains specific image extensions or generic image/*
      if (IMAGE_EXTENSIONS.some(ext => filenameLower.endsWith(ext)) || type.startsWith('image/')) {
          const isAllowed = acceptedFileTypes.includes('image/*') || 
                            acceptedFileTypes.some(ext => filenameLower.endsWith(ext.toLowerCase()));
          // If we accept generic project files (like in documentation), we should also accept images
          if (isAllowed || acceptedFileTypes.includes('.ts')) {
              return null;
          }
      }
      
      let identifier: string;
      const parts = filenameOnly.split('.');
      if (parts.length === 1) { // e.g. Dockerfile
          identifier = filenameLower;
      } else if (parts[0] === '' && parts.length === 2) { // e.g. .gitignore
          identifier = `.${parts[1].toLowerCase()}`;
      } else { // e.g. script.js
          identifier = `.${parts[parts.length - 1].toLowerCase()}`;
      }

      // Loose check: If we accept code, we usually accept all code.
      // If strict checking is required, the consumer should filter the result.
      if (acceptedFileTypes.length > 0 && !acceptedFileTypes.includes(identifier) && !acceptedFileTypes.includes('image/*')) {
           return 'SKIP';
      }
      return null;
  }, [acceptedFileTypes, maxFileSizeMB]);


  const processSingleFile = useCallback(async (file: File, pathPrefix: string = ''): Promise<{ fileData: { filename: string; content: string; file: File; mimeType: string; encoding: 'utf-8' | 'base64' } | null, warning: string | null }> => {
    const filename = pathPrefix + file.name;
    const validationResult = validateFile(filename, file.size, file.type);
    
    if (validationResult === 'SKIP') {
        return { fileData: null, warning: null }; // Silently skip
    }
    if (validationResult) {
        return { fileData: null, warning: validationResult };
    }

    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    let content = '';
    let warning: string | null = null;
    let encoding: 'utf-8' | 'base64' = 'utf-8';
    let mimeType = file.type || 'application/octet-stream';

    // Handle Images and Binaries
    if (file.type.startsWith('image/') || IMAGE_EXTENSIONS.includes(fileExtension)) {
        try {
            const base64Url = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            // remove data:image/png;base64, prefix for the raw content if needed, 
            // but keeping it as Data URL is often safer for immediate display. 
            // However, typical LLM APIs want the base64 part only.
            content = base64Url.split(',')[1];
            encoding = 'base64';
            mimeType = file.type || 'image/jpeg'; // Default to jpeg if type missing but ext matches
        } catch (e) {
            warning = `Failed to process image "${filename}".`;
        }
    } else if (fileExtension === '.pdf') {
        try {
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs';
            const buffer = await file.arrayBuffer();
            const typedarray = new Uint8Array(buffer);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let textContent = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const text = await page.getTextContent();
                textContent += text.items.map(item => (item as any).str).join(' ');
                if (i < pdf.numPages) textContent += '\n\n--- Page Break ---\n\n';
            }
            content = textContent.trim();
            mimeType = 'application/pdf';
        } catch (e) {
            warning = `Failed to parse PDF "${filename}". It may be corrupt or encrypted.`;
        }
    } else {
        try {
            // Attempt to read as text first
            content = await file.text();
            mimeType = 'text/plain';
        } catch (e) {
            warning = `Could not read "${filename}" as text.`;
        }
    }
    
    if (warning) return { fileData: null, warning };
    
    return { 
        fileData: { 
            filename, 
            content, 
            file, 
            mimeType, 
            encoding 
        }, 
        warning: null 
    };
  }, [validateFile]);


  const handleFileProcessing = useCallback(async (files: FileList) => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    setIsProcessing(true);
    setIsDragOver(false);
    setWarnings([]);
    setUploadSuccessMessage(null);

    const processedFiles: Array<{ filename: string; content: string; file: File; mimeType: string; encoding: 'utf-8' | 'base64' }> = [];
    const currentWarnings: string[] = [];

    try {
        for (const file of Array.from(files)) {
          const filename = (file as any).relativePath || (file as any).webkitRelativePath || file.name;
          const fileExtension = `.${filename.split('.').pop()?.toLowerCase()}`;

          if (fileExtension === '.zip') {
            try {
              const JSZip = (await import('jszip')).default;
              const zip = await JSZip.loadAsync(file);
              for (const zipFilename in zip.files) {
                if (zip.files[zipFilename].dir) continue;
                
                const zipFile = zip.files[zipFilename];
                // Try to determine mime type roughly from extension
                const ext = `.${zipFilename.split('.').pop()?.toLowerCase()}`;
                const type = IMAGE_EXTENSIONS.includes(ext) ? `image/${ext.replace('.', '')}` : 'text/plain';
                
                const newFile = new File([await zipFile.async('blob')], zipFile.name, { type });
                const { fileData, warning } = await processSingleFile(
                    newFile,
                    `${file.name}/` // Prefix with zip file name
                );
                if(warning) currentWarnings.push(warning);
                if(fileData) processedFiles.push(fileData);
              }
            } catch (e) {
                currentWarnings.push(`Failed to process ZIP file "${filename}". It may be corrupt.`);
            }
          } else {
            let pathPrefix = '';
            // If filename includes slash and doesn't start with it (simple check), assume relative path is embedded
            if (filename !== file.name && filename.includes('/')) {
                 const lastSlashIndex = filename.lastIndexOf('/');
                 if (lastSlashIndex !== -1) {
                     pathPrefix = filename.substring(0, lastSlashIndex + 1);
                 }
            }
            
            const { fileData, warning } = await processSingleFile(file, pathPrefix);
            if(warning) currentWarnings.push(warning);
            if(fileData) processedFiles.push(fileData);
          }
        }

        if (processedFiles.length > 0) {
          onFilesUploaded(processedFiles);
          const message = `${processedFiles.length} file(s) processed successfully.`;
          setUploadSuccessMessage(message);
          successTimeoutRef.current = window.setTimeout(() => {
              setUploadSuccessMessage(null);
          }, 3000);
        }
    } catch(e) {
        console.error("Error during file processing:", e);
        currentWarnings.push("An unexpected error occurred during processing.");
    } finally {
        if (currentWarnings.length > 0) {
          setWarnings(currentWarnings);
        }
        setIsProcessing(false);
    }
  }, [onFilesUploaded, processSingleFile]);
  
  const readAllDirectoryEntries = async (directoryReader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> => {
    return new Promise((resolve, reject) => {
        let entries: FileSystemEntry[] = [];
        const readEntries = () => {
            directoryReader.readEntries(results => {
                if (results.length > 0) {
                    entries = entries.concat(Array.from(results));
                    readEntries();
                } else {
                    resolve(entries);
                }
            }, (err) => {
                console.error('Error reading directory entries:', err);
                reject(new Error('Failed to read directory entries. The directory might be corrupted or permissions may be denied.'));
            });
        };
        readEntries();
    });
  };

  const traverseFileTree = useCallback(async (entry: FileSystemEntry | null, path: string = ''): Promise<{ files: File[], warnings: string[] }> => {
      const collectedFiles: File[] = [];
      const collectedWarnings: string[] = [];
      if (!entry) return { files: [], warnings: [] };

      if (entry.isFile) {
          await new Promise<void>(resolve => {
              (entry as FileSystemFileEntry).file(file => {
                  const fullPath = path + file.name;
                  (file as any).relativePath = fullPath;
                  collectedFiles.push(file);
                  resolve();
              }, () => {
                  collectedWarnings.push(`Failed to read file: ${path}${entry.name}`);
                  resolve();
              });
          });
      } else if (entry.isDirectory) {
          const dirReader = (entry as FileSystemDirectoryEntry).createReader();
          const entries = await readAllDirectoryEntries(dirReader);
          for (const subEntry of entries) {
              const result = await traverseFileTree(subEntry, path + entry.name + '/');
              collectedFiles.push(...result.files);
              collectedWarnings.push(...result.warnings);
          }
      }
      return { files: collectedFiles, warnings: collectedWarnings };
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0 && (e.dataTransfer.items[0] as any).webkitGetAsEntry) {
            const items = Array.from(e.dataTransfer.items);
            const allFiles: File[] = [];
            let allWarnings: string[] = [];
    
            const treePromises = items.map(item => traverseFileTree((item as any).webkitGetAsEntry(), ''));
            const results = await Promise.all(treePromises);
            
            results.forEach(result => {
                allFiles.push(...result.files);
                allWarnings.push(...result.warnings);
            });
    
            if (allFiles.length > 0) {
                const dataTransfer = new DataTransfer();
                allFiles.forEach(file => dataTransfer.items.add(file));
                await handleFileProcessing(dataTransfer.files);
            }
            if (allWarnings.length > 0) {
                setWarnings(prev => [...prev, ...allWarnings]);
            }
        } else if (e.dataTransfer.files) {
            await handleFileProcessing(e.dataTransfer.files);
        }
    } catch (err) {
        console.error("Error processing dropped directory:", err);
        setWarnings(prev => [...prev, "An error occurred while reading a directory. Some files may not have been processed."]);
    }
  }, [handleFileProcessing, traverseFileTree]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcessing(e.target.files);
    }
    e.target.value = '';
  };
  
  const stateClasses = isProcessing
    ? 'border-gray-500 bg-gray-700/50 cursor-wait'
    : uploadSuccessMessage
    ? 'border-green-500 bg-green-900/30'
    : isDragOver
    ? 'border-fuchsia-400 bg-fuchsia-900/30'
    : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30';

  const acceptString = acceptedFileTypes
    .filter(type => type.startsWith('.') || type.includes('/'))
    .join(',');

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        className={`p-6 border-2 border-dashed rounded-lg text-center transition-all duration-300 ${stateClasses}`}
      >
        <input 
            type="file"
            ref={fileInputRef}
            onChange={onFileSelect}
            multiple
            className="hidden"
            accept={acceptString}
        />
        
        {enableDirectoryUpload && (
            <input
                type="file"
                ref={folderInputRef}
                onChange={onFileSelect}
                multiple
                className="hidden"
                accept={acceptString}
                {...({ webkitdirectory: "" } as any)}
            />
        )}
        
        {isProcessing ? (
            <div className="flex flex-col items-center justify-center pointer-events-none">
                <Loader className="h-8 w-8" />
                <p className="mt-2 text-gray-400">Processing files...</p>
            </div>
        ) : uploadSuccessMessage ? (
            <div className="flex flex-col items-center justify-center pointer-events-none text-green-300">
                <CheckIcon className="w-8 h-8 mx-auto mb-2" />
                <p className="font-semibold">{uploadSuccessMessage}</p>
            </div>
        ) : (
            <div className="pointer-events-none">
                <UploadIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <div className="flex flex-col items-center gap-1">
                    <div className="text-gray-300 text-sm flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="font-semibold text-fuchsia-400 hover:text-fuchsia-300 pointer-events-auto underline decoration-dashed underline-offset-4"
                        >
                            Select Files
                        </button>
                        {enableDirectoryUpload && (
                            <>
                                <span className="text-gray-500">or</span>
                                <button
                                    type="button"
                                    onClick={() => folderInputRef.current?.click()}
                                    className="font-semibold text-cyan-400 hover:text-cyan-300 pointer-events-auto underline decoration-dashed underline-offset-4"
                                >
                                    Select Folder
                                </button>
                            </>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">or drag and drop here</p>
                </div>
                <p className="text-xs text-gray-600 mt-2 max-w-[200px] mx-auto truncate">
                    Supported: {acceptedFileTypes.length > 0 ? acceptedFileTypes.join(', ') : 'All Files'}
                </p>
            </div>
        )}

      </div>
      {warnings.length > 0 && (
        <div className="mt-3 p-3 bg-yellow-900/50 border border-yellow-700 rounded-md text-sm">
          <p className="font-semibold text-yellow-300">Processing Warnings:</p>
          <ul className="list-disc list-inside mt-1 text-yellow-400">
            {warnings.slice(0, 5).map((warn, i) => <li key={i}>{warn}</li>)}
            {warnings.length > 5 && <li>...and {warnings.length - 5} more</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
