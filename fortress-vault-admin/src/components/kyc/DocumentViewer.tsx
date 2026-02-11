import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Download, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { IdentityDocument } from '@/hooks/useKYCManagement';

interface DocumentViewerProps {
  documents: IdentityDocument[];
  onClose?: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ documents, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentDocument = documents[currentIndex];

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleDownload = () => {
    if (!currentDocument) return;
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = currentDocument.document_url;
    link.download = `document_${currentDocument.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setZoom(100); // Reset zoom when changing documents
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(documents.length - 1, prev + 1));
    setZoom(100); // Reset zoom when changing documents
  };

  if (!currentDocument) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No documents available
      </div>
    );
  }

  return (
    <div
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-black'
          : 'relative bg-gray-50 rounded-lg'
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            {currentDocument.document_type}
          </span>
          <span className="text-sm text-muted-foreground">
            ({currentIndex + 1} of {documents.length})
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Navigation */}
          {documents.length > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === documents.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-2" />
            </>
          )}

          {/* Zoom controls */}
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[3rem] text-center">
            {zoom}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Download */}
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>

          {/* Fullscreen */}
          <Button variant="outline" size="sm" onClick={handleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>

          {/* Close (only in fullscreen or if onClose provided) */}
          {(isFullscreen || onClose) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isFullscreen) {
                  setIsFullscreen(false);
                } else if (onClose) {
                  onClose();
                }
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Document display */}
      <div
        className={`overflow-auto ${
          isFullscreen ? 'h-[calc(100vh-73px)]' : 'h-96'
        }`}
      >
        <div className="flex items-center justify-center min-h-full p-4">
          <img
            src={currentDocument.document_url}
            alt={currentDocument.document_type}
            style={{
              width: `${zoom}%`,
              maxWidth: 'none',
            }}
            className="object-contain"
          />
        </div>
      </div>

      {/* Document info */}
      <div className="p-4 bg-white border-t text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>
            Uploaded: {new Date(currentDocument.uploaded_at).toLocaleDateString()}
          </span>
          <span>Document ID: {currentDocument.id}</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
