"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/dashboard/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PermissionGate } from "@/components/core/permission-gate";
import { useMedia, useUploadMedia, useDeleteMedia } from "@/hooks/use-core-queries";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Image as ImageIcon,
  Upload,
  Search,
  LayoutGrid,
  List,
  HardDrive,
  Download,
  Trash2,
  Eye,
  Music,
  Video,
  FileText,
  File,
  CloudUpload,
  X,
  Loader2,
  MoreVertical,
  Clock,
  FolderOpen,
  AudioWaveform,
} from "lucide-react";

// ============ TYPES ============

type MediaType = "audio" | "image" | "video" | "lyrics" | "document";
type ViewMode = "grid" | "list";
type SortMode = "recent" | "name" | "size";
type TypeFilter = "all" | MediaType;

interface MediaItem {
  id: string;
  fileName: string;
  type: MediaType;
  mimeType: string;
  size: number;
  url: string;
  projectId?: string;
  projectName?: string;
  createdAt: string;
}

// ============ CONSTANTS ============

const TYPE_FILTERS: { value: TypeFilter; label: string; icon?: React.ReactNode }[] = [
  { value: "all", label: "Tout" },
  { value: "audio", label: "Audio", icon: <Music className="w-3.5 h-3.5" /> },
  { value: "image", label: "Images", icon: <ImageIcon className="w-3.5 h-3.5" /> },
  { value: "video", label: "Vidéos", icon: <Video className="w-3.5 h-3.5" /> },
  { value: "lyrics", label: "Paroles", icon: <FileText className="w-3.5 h-3.5" /> },
  { value: "document", label: "Documents", icon: <File className="w-3.5 h-3.5" /> },
];

const TYPE_COLORS: Record<MediaType, { bg: string; text: string; border: string; icon: string }> = {
  audio: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
    icon: "text-purple-400",
  },
  image: {
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    border: "border-pink-500/20",
    icon: "text-pink-400",
  },
  video: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    icon: "text-blue-400",
  },
  lyrics: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: "text-emerald-400",
  },
  document: {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/20",
    icon: "text-slate-400",
  },
};

const TYPE_LABELS: Record<MediaType, string> = {
  audio: "Audio",
  image: "Image",
  video: "Vidéo",
  lyrics: "Paroles",
  document: "Document",
};

const ACCEPTED_FORMATS = ".mp3,.wav,.flac,.ogg,.png,.jpg,.jpeg,.webp,.gif,.mp4,.mov,.webm,.pdf,.txt,.doc,.docx";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// ============ HELPERS ============

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function inferMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.includes("pdf") || mimeType.includes("word") || mimeType.includes("document")) return "document";
  if (mimeType.includes("text") || mimeType.includes("lyrics")) return "lyrics";
  return "document";
}

function getTypeIcon(type: MediaType, className?: string) {
  const cls = className || "w-6 h-6";
  switch (type) {
    case "audio":
      return <Music className={cls} />;
    case "image":
      return <ImageIcon className={cls} />;
    case "video":
      return <Video className={cls} />;
    case "lyrics":
      return <FileText className={cls} />;
    case "document":
      return <File className={cls} />;
  }
}

// ============ COMPONENT ============

export default function MediaLibraryPage() {
  // --- State ---
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [isDragOver, setIsDragOver] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Queries ---
  const { data: mediaData, isLoading: mediaLoading } = useMedia();
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();

  const mediaItems: MediaItem[] = useMemo(() => {
    if (!mediaData || !Array.isArray(mediaData)) return [];
    return mediaData;
  }, [mediaData]);

  // --- Filtering & Sorting ---
  const filteredMedia = useMemo(() => {
    let items = [...mediaItems];

    // Type filter
    if (typeFilter !== "all") {
      items = items.filter((item) => item.type === typeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.fileName.toLowerCase().includes(q) ||
          item.projectName?.toLowerCase().includes(q) ||
          TYPE_LABELS[item.type]?.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortMode) {
      case "recent":
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "name":
        items.sort((a, b) => a.fileName.localeCompare(b.fileName));
        break;
      case "size":
        items.sort((a, b) => b.size - a.size);
        break;
    }

    return items;
  }, [mediaItems, typeFilter, searchQuery, sortMode]);

  // --- Upload handler ---
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        // Validate size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} dépasse la limite de 50 Mo`);
          continue;
        }

        // Infer type
        const mediaType = inferMediaType(file.type);
        setUploadingFiles((prev) => [...prev, file.name]);

        try {
          // In a real implementation, you'd upload to blob storage first,
          // then register with the API. For now we simulate the upload.
          const uploadData = {
            type: mediaType,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            url: URL.createObjectURL(file), // temporary local URL
          };

          await uploadMedia.mutateAsync(uploadData);
          toast.success(`${file.name} importé avec succès`);
        } catch {
          toast.error(`Erreur lors de l'import de ${file.name}`);
        } finally {
          setUploadingFiles((prev) => prev.filter((n) => n !== file.name));
        }
      }
    },
    [uploadMedia]
  );

  // --- Drag & Drop ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleFiles]
  );

  // --- Delete handler ---
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMedia.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.fileName} supprimé`);
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteMedia]);

  // --- Download handler ---
  const handleDownload = useCallback((item: MediaItem) => {
    const link = document.createElement("a");
    link.href = item.url;
    link.download = item.fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.info("Téléchargement en cours...");
  }, []);

  // --- Preview handler ---
  const handlePreview = useCallback((item: MediaItem) => {
    window.open(item.url, "_blank");
  }, []);

  // --- Render ---
  return (
    <AppLayout title="Médiathèque">
      <PermissionGate feature="UPLOAD_MEDIA" showDisabled>
        <div className="space-y-6">
          {/* ============ HEADER ============ */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Médiathèque</h1>
                <p className="text-sm text-slate-400">
                  {mediaItems.length} fichier{mediaItems.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Button
              className="btn-gradient text-white font-bold rounded-xl shadow-lg shadow-purple-500/25"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Importer
            </Button>
          </div>

          {/* ============ FILTER BAR ============ */}
          <div className="flex flex-col gap-4">
            {/* Type filter tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-select">
              {TYPE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setTypeFilter(filter.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all touch-target",
                    typeFilter === filter.value
                      ? "bg-purple-500/15 text-purple-400 border border-purple-500/25"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                >
                  {filter.icon}
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Search, view toggle, sort */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Rechercher un fichier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex items-center rounded-lg bg-white/5 border border-white/10 p-0.5">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      viewMode === "grid"
                        ? "bg-purple-500/15 text-purple-400"
                        : "text-slate-500 hover:text-white"
                    )}
                    aria-label="Vue grille"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      viewMode === "list"
                        ? "bg-purple-500/15 text-purple-400"
                        : "text-slate-500 hover:text-white"
                    )}
                    aria-label="Vue liste"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort dropdown */}
                <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                  <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-slate-300 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#16162A] border-white/10">
                    <SelectItem value="recent" className="text-slate-300 focus:text-white focus:bg-white/5">
                      Récent
                    </SelectItem>
                    <SelectItem value="name" className="text-slate-300 focus:text-white focus:bg-white/5">
                      Nom
                    </SelectItem>
                    <SelectItem value="size" className="text-slate-300 focus:text-white focus:bg-white/5">
                      Taille
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ============ UPLOAD AREA ============ */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200",
                isDragOver
                  ? "border-purple-500/60 bg-purple-500/5"
                  : "border-white/10 bg-white/[0.02] hover:border-purple-500/30 hover:bg-purple-500/[0.03]"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_FORMATS}
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Sélectionner des fichiers"
              />

              <div className="flex flex-col items-center gap-3">
                {isDragOver ? (
                  <>
                    <CloudUpload className="w-10 h-10 text-purple-400 animate-bounce" />
                    <p className="text-purple-400 font-medium">Déposez vos fichiers ici</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        Glisser-déposer ou cliquer pour importer
                      </p>
                      <p className="text-slate-500 text-sm mt-1">
                        MP3, WAV, PNG, JPG, MP4, PDF — Max 50 Mo par fichier
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Uploading indicators */}
              {uploadingFiles.length > 0 && (
                <div className="absolute inset-0 bg-[#0B0B14]/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-2 z-10">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  <p className="text-white text-sm font-medium">
                    Import en cours... ({uploadingFiles.length})
                  </p>
                  <p className="text-slate-400 text-xs max-w-xs truncate">
                    {uploadingFiles[0]}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* ============ LOADING STATE ============ */}
          {mediaLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <span className="ml-3 text-slate-400">Chargement de la médiathèque...</span>
            </div>
          )}

          {/* ============ EMPTY STATE ============ */}
          {!mediaLoading && filteredMedia.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-20"
            >
              <HardDrive className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              {mediaItems.length === 0 ? (
                <>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Aucun fichier encore
                  </h3>
                  <p className="text-slate-400 text-sm mb-6">
                    Importe ton premier fichier pour commencer
                  </p>
                  <Button
                    className="btn-gradient text-white font-bold rounded-xl"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Importer un fichier
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Aucun fichier trouvé
                  </h3>
                  <p className="text-slate-400 text-sm mb-6">
                    Essaie avec un autre filtre ou terme de recherche
                  </p>
                  <Button
                    variant="ghost"
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                    onClick={() => {
                      setTypeFilter("all");
                      setSearchQuery("");
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Réinitialiser les filtres
                  </Button>
                </>
              )}
            </motion.div>
          )}

          {/* ============ GRID VIEW ============ */}
          {!mediaLoading && filteredMedia.length > 0 && viewMode === "grid" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredMedia.map((item, i) => {
                  const colors = TYPE_COLORS[item.type];
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.35, delay: i * 0.04 }}
                      layout
                    >
                      <Card className="glass overflow-hidden group hover:border-purple-500/20 transition-all">
                        {/* Thumbnail / Preview area */}
                        <div
                          className={cn(
                            "relative aspect-square flex items-center justify-center",
                            item.type === "audio" && "bg-gradient-to-br from-purple-500/15 via-purple-900/10 to-transparent",
                            item.type === "image" && "bg-gradient-to-br from-pink-500/15 via-pink-900/10 to-transparent",
                            item.type === "video" && "bg-gradient-to-br from-blue-500/15 via-blue-900/10 to-transparent",
                            item.type === "lyrics" && "bg-gradient-to-br from-emerald-500/15 via-emerald-900/10 to-transparent",
                            item.type === "document" && "bg-gradient-to-br from-slate-500/15 via-slate-900/10 to-transparent"
                          )}
                        >
                          {/* Type icon */}
                          <div className={cn("transition-transform group-hover:scale-110", colors.icon)}>
                            {item.type === "audio" ? (
                              <AudioWaveform className="w-10 h-10" />
                            ) : (
                              getTypeIcon(item.type, "w-10 h-10")
                            )}
                          </div>

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-9 h-9 rounded-lg bg-white/10 text-white hover:bg-white/20 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreview(item);
                              }}
                              aria-label="Aperçu"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-9 h-9 rounded-lg bg-white/10 text-white hover:bg-white/20 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(item);
                              }}
                              aria-label="Télécharger"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(item);
                              }}
                              aria-label="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Type badge */}
                          <div className="absolute top-2 right-2">
                            <Badge
                              className={cn(
                                "text-[10px] font-medium border-0",
                                colors.bg,
                                colors.text
                              )}
                            >
                              {TYPE_LABELS[item.type]}
                            </Badge>
                          </div>
                        </div>

                        {/* Card info */}
                        <div className="p-3 space-y-1.5">
                          <p className="text-white text-sm font-medium truncate" title={item.fileName}>
                            {item.fileName}
                          </p>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{formatFileSize(item.size)}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* ============ LIST VIEW ============ */}
          {!mediaLoading && filteredMedia.length > 0 && viewMode === "list" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Card className="glass overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-slate-400 font-medium">Nom</TableHead>
                      <TableHead className="text-slate-400 font-medium">Type</TableHead>
                      <TableHead className="text-slate-400 font-medium hidden sm:table-cell">Taille</TableHead>
                      <TableHead className="text-slate-400 font-medium hidden md:table-cell">Projet</TableHead>
                      <TableHead className="text-slate-400 font-medium hidden sm:table-cell">Date</TableHead>
                      <TableHead className="text-slate-400 font-medium w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedia.map((item, i) => {
                      const colors = TYPE_COLORS[item.type];
                      return (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.03 }}
                          className="border-white/5 hover:bg-white/[0.03] transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", colors.bg)}>
                                <span className={colors.icon}>
                                  {getTypeIcon(item.type, "w-4 h-4")}
                                </span>
                              </div>
                              <span className="text-white text-sm font-medium truncate max-w-[200px]" title={item.fileName}>
                                {item.fileName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] font-medium border-0", colors.bg, colors.text)}
                            >
                              {TYPE_LABELS[item.type]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm hidden sm:table-cell">
                            {formatFileSize(item.size)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {item.projectName ? (
                              <span className="text-slate-300 text-sm flex items-center gap-1">
                                <FolderOpen className="w-3 h-3" />
                                {item.projectName}
                              </span>
                            ) : (
                              <span className="text-slate-600 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm hidden sm:table-cell">
                            {formatDate(item.createdAt)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-7 h-7 text-slate-500 hover:text-white hover:bg-white/5"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 bg-[#16162A] border-white/10">
                                <DropdownMenuItem
                                  className="text-slate-300 focus:text-white focus:bg-white/5"
                                  onClick={() => handlePreview(item)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Aperçu
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-slate-300 focus:text-white focus:bg-white/5"
                                  onClick={() => handleDownload(item)}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Télécharger
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  className="focus:bg-red-500/5"
                                  onClick={() => setDeleteTarget(item)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}

          {/* ============ DELETE CONFIRMATION DIALOG ============ */}
          <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
            <AlertDialogContent className="bg-[#16162A] border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Supprimer ce fichier ?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  {deleteTarget && (
                    <>
                      Le fichier <span className="text-white font-medium">{deleteTarget.fileName}</span> sera
                      supprimé définitivement. Cette action est irréversible.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white">
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 hover:text-red-300"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PermissionGate>
    </AppLayout>
  );
}
