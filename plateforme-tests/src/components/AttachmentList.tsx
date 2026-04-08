"use client";

import { useState, useRef } from "react";
import { Attachment } from "@/types";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";

interface AttachmentListProps {
  attachments: Attachment[];
  onUpload?: (file: File) => Promise<void>;
  onDownload?: (attachmentId: number, filename: string) => void;
  onDelete?: (attachmentId: number) => void;
  readonly?: boolean;
  maxFileSizeMB?: number;
  allowedExtensions?: string[];
}

export function AttachmentList({
  attachments,
  onUpload,
  onDownload,
  onDelete,
  readonly = false,
  maxFileSizeMB = 10,
  allowedExtensions = [".pdf", ".docx", ".png", ".jpg", ".jpeg", ".txt", ".log"],
}: AttachmentListProps) {
  const confirmDialog = useConfirmDialog();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUpload) return;

    // Validate file extension
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setUploadError(
        `Extension non autorisée. Acceptées : ${allowedExtensions.join(", ")}`
      );
      return;
    }

    // Validate file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxFileSizeMB) {
      setUploadError(
        `Fichier trop volumineux (${sizeMB.toFixed(1)} MB). Maximum : ${maxFileSizeMB} MB`
      );
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      await onUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setUploadError("Erreur lors de l'upload du fichier");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (contentType: string): string => {
    if (contentType.startsWith("image/")) return "image";
    if (contentType.includes("pdf")) return "picture_as_pdf";
    if (contentType.includes("word") || contentType.includes("document"))
      return "description";
    if (contentType.includes("text")) return "text_snippet";
    return "insert_drive_file";
  };

  return (
    <div className="space-y-3">
      {/* Upload button */}
      {!readonly && onUpload && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept={allowedExtensions.join(",")}
          />
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isUploading ? "hourglass_empty" : "upload"}
            </span>
            {isUploading ? "Upload en cours..." : "Ajouter une pièce jointe"}
          </button>
          {uploadError && (
            <p className="text-red-400 text-sm mt-2">{uploadError}</p>
          )}
        </div>
      )}

      {/* Attachments list */}
      {attachments.length === 0 ? (
        <div className="text-center py-4 text-[#9dabb9] text-sm">
          Aucune pièce jointe
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 bg-[#1a1f26] border border-[#3b4754] rounded-lg hover:border-primary/50 transition-all"
            >
              <span className="material-symbols-outlined text-primary text-[24px]">
                {getFileIcon(attachment.content_type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {attachment.filename}
                </p>
                <p className="text-[#9dabb9] text-xs">
                  {formatDate(attachment.uploaded_at)}
                </p>
              </div>
              <div className="flex gap-1">
                {onDownload && (
                  <button
                    onClick={() => onDownload(attachment.id, attachment.filename)}
                    className="p-2 hover:bg-blue-500/10 rounded transition-colors"
                    title="Télécharger"
                  >
                    <span className="material-symbols-outlined text-[18px] text-blue-400">
                      download
                    </span>
                  </button>
                )}
                {!readonly && onDelete && (
                  <button
                    onClick={async () => {
                      const confirmed = await confirmDialog({
                        title: "Supprimer la pièce jointe",
                        description:
                          "Êtes-vous sûr de vouloir supprimer cette pièce jointe ?",
                        confirmText: "Supprimer",
                        cancelText: "Annuler",
                        confirmVariant: "destructive",
                      });

                      if (confirmed) {
                        onDelete(attachment.id);
                      }
                    }}
                    className="p-2 hover:bg-red-500/10 rounded transition-colors"
                    title="Supprimer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-red-400">
                      delete
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
