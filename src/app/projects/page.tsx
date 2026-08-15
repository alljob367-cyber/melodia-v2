"use client";

import { useState, useMemo } from "react";
import { AppLayout } from "@/components/dashboard/app-layout";
import { PermissionGate } from "@/components/core/permission-gate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/use-core-queries";
import {
  FolderOpen,
  PlusCircle,
  Search,
  Music,
  Disc,
  Film,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  ImageIcon,
  Folder,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============ TYPES ============

interface Project {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  status: string;
  songCount?: number;
  mediaCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ============ CONSTANTS ============

const PROJECT_TYPES = [
  { value: "single", label: "Single", icon: Music, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { value: "ep", label: "EP", icon: Disc, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  { value: "album", label: "Album", icon: AlbumIcon, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { value: "video_project", label: "Vidéo", icon: Film, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
] as const;

const STATUS_CONFIG = {
  active: { label: "Actif", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  archived: { label: "Archivé", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
} as const;

function AlbumIcon(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" />
    </svg>
  );
}

// ============ HELPERS ============

function getTypeConfig(type: string) {
  return PROJECT_TYPES.find((t) => t.value === type) || PROJECT_TYPES[0];
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active;
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
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ============ STAGGER ANIMATION VARIANTS ============

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
} as const;

// ============ MAIN COMPONENT ============

export default function ProjectsPage() {
  // --- Data ---
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  // --- UI State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // --- Form State ---
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("single");
  const [formDescription, setFormDescription] = useState("");

  // --- Filtered Projects ---
  const filteredProjects = useMemo(() => {
    if (!projects || !Array.isArray(projects)) return [];
    return (projects as Project[]).filter((p: Project) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || p.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [projects, searchQuery, typeFilter]);

  // --- Form helpers ---
  const resetForm = () => {
    setFormName("");
    setFormType("single");
    setFormDescription("");
  };

  // --- Handlers ---
  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error("Le nom du projet est requis");
      return;
    }
    try {
      await createProject.mutateAsync({
        name: formName.trim(),
        type: formType,
        description: formDescription.trim() || undefined,
      });
      toast.success("Projet créé avec succès !");
      setCreateOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la création du projet");
    }
  };

  const handleEdit = async () => {
    if (!selectedProject || !formName.trim()) {
      toast.error("Le nom du projet est requis");
      return;
    }
    try {
      await updateProject.mutateAsync({
        id: selectedProject.id,
        name: formName.trim(),
        description: formDescription.trim() || undefined,
      } as any);
      toast.success("Projet mis à jour");
      setEditOpen(false);
      setSelectedProject(null);
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    try {
      await deleteProject.mutateAsync(selectedProject.id);
      toast.success("Projet supprimé");
      setDeleteOpen(false);
      setSelectedProject(null);
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la suppression");
    }
  };

  const openEdit = (project: Project) => {
    setSelectedProject(project);
    setFormName(project.name);
    setFormType(project.type);
    setFormDescription(project.description || "");
    setEditOpen(true);
  };

  const openDelete = (project: Project) => {
    setSelectedProject(project);
    setDeleteOpen(true);
  };

  // ============ RENDER ============
  return (
    <AppLayout title="Projets">
      <div className="space-y-6">
        {/* ====== PAGE HEADER ====== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Folder className="w-6 h-6 text-purple-400" />
                Mes Projets
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Organise tes chansons, EP, albums et projets vidéo
              </p>
            </div>

            <PermissionGate feature="CREATE_PROJECT">
              <Dialog
                open={createOpen}
                onOpenChange={(open) => {
                  setCreateOpen(open);
                  if (!open) resetForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button className="btn-gradient text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:scale-105 transition-transform">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Créer un projet
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#16162A] border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      Nouveau projet
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Crée un projet pour organiser tes créations musicales
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">
                        Nom du projet
                      </Label>
                      <Input
                        placeholder="Mon super projet..."
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50"
                        autoFocus
                      />
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">Type</Label>
                      <Select value={formType} onValueChange={setFormType}>
                        <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Choisir un type" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#16162A] border-white/10">
                          {PROJECT_TYPES.map((type) => (
                            <SelectItem
                              key={type.value}
                              value={type.value}
                              className="text-slate-300 focus:text-white focus:bg-white/5"
                            >
                              <span className="flex items-center gap-2">
                                <type.icon className={cn("w-4 h-4", type.color)} />
                                {type.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">
                        Description
                      </Label>
                      <Textarea
                        placeholder="Décris ton projet..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        rows={3}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50 resize-none"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCreateOpen(false);
                        resetForm();
                      }}
                      className="text-slate-400 hover:text-white hover:bg-white/5"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={createProject.isPending || !formName.trim()}
                      className="btn-gradient text-white font-semibold rounded-lg"
                    >
                      {createProject.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <PlusCircle className="w-4 h-4 mr-2" />
                      )}
                      Créer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </PermissionGate>
          </div>
        </motion.div>

        {/* ====== SEARCH & FILTER BAR ====== */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Rechercher un projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50"
              />
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent className="bg-[#16162A] border-white/10">
                  <SelectItem
                    value="all"
                    className="text-slate-300 focus:text-white focus:bg-white/5"
                  >
                    <span className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-slate-400" />
                      Tous les types
                    </span>
                  </SelectItem>
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="text-slate-300 focus:text-white focus:bg-white/5"
                    >
                      <span className="flex items-center gap-2">
                        <type.icon className={cn("w-4 h-4", type.color)} />
                        {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear filter button */}
              {typeFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTypeFilter("all")}
                  className="text-slate-400 hover:text-white hover:bg-white/5 h-9 w-9"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ====== LOADING STATE ====== */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <span className="ml-3 text-slate-400 text-sm">
              Chargement des projets...
            </span>
          </div>
        )}

        {/* ====== PROJECTS GRID ====== */}
        {!isLoading && filteredProjects.length > 0 && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project: Project) => {
                const typeConf = getTypeConfig(project.type);
                const statusConf = getStatusConfig(project.status);
                const TypeIcon = typeConf.icon;

                return (
                  <motion.div
                    key={project.id}
                    variants={itemVariants}
                    layout
                    exit={{
                      opacity: 0,
                      scale: 0.95,
                      transition: { duration: 0.25 },
                    }}
                  >
                    <Card className="glass p-5 hover:border-purple-500/20 transition-all group relative overflow-hidden cursor-pointer">
                      {/* Decorative glow on hover */}
                      <div
                        className={cn(
                          "absolute top-0 right-0 w-24 h-24 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                          project.type === "single" && "bg-purple-500/10",
                          project.type === "ep" && "bg-pink-500/10",
                          project.type === "album" && "bg-amber-500/10",
                          project.type === "video_project" &&
                            "bg-emerald-500/10"
                        )}
                      />

                      <div className="relative space-y-3">
                        {/* Row 1: Type icon + Name + Type badge */}
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                              typeConf.bg
                            )}
                          >
                            <TypeIcon
                              className={cn("w-5 h-5", typeConf.color)}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate group-hover:text-purple-200 transition-colors">
                              {project.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] mt-1 px-2 py-0",
                                typeConf.border,
                                typeConf.color,
                                typeConf.bg
                              )}
                            >
                              {typeConf.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Row 2: Description */}
                        {project.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {project.description}
                          </p>
                        )}

                        {/* Row 3: Stats */}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Music className="w-3 h-3" />
                            {project.songCount ?? 0}{" "}
                            {(project.songCount ?? 0) !== 1
                              ? "chansons"
                              : "chanson"}
                          </span>
                          <span className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {project.mediaCount ?? 0}{" "}
                            {(project.mediaCount ?? 0) !== 1
                              ? "médias"
                              : "média"}
                          </span>
                        </div>

                        {/* Row 4: Date + Status */}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            {formatDate(project.createdAt)}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] px-1.5 py-0",
                              statusConf.border,
                              statusConf.color,
                              statusConf.bg
                            )}
                          >
                            {statusConf.label}
                          </Badge>
                        </div>

                        {/* Row 5: Hover actions */}
                        <div className="flex items-center gap-1 pt-1 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <PermissionGate feature="UPDATE_PROJECT">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(project);
                              }}
                              className="h-7 text-xs text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 gap-1"
                            >
                              <Pencil className="w-3 h-3" />
                              Modifier
                            </Button>
                          </PermissionGate>
                          <PermissionGate feature="DELETE_PROJECT">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDelete(project);
                              }}
                              className="h-7 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Supprimer
                            </Button>
                          </PermissionGate>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ====== EMPTY STATE ====== */}
        {!isLoading && filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-5">
                <FolderOpen className="w-10 h-10 text-purple-400" />
              </div>
              {(!projects ||
                !Array.isArray(projects) ||
                (projects as Project[]).length === 0) ? (
                <>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Aucun projet encore
                  </h3>
                  <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                    Crée ton premier projet pour organiser tes chansons, albums
                    et clips vidéo en un seul endroit
                  </p>
                  <PermissionGate feature="CREATE_PROJECT">
                    <Button
                      onClick={() => setCreateOpen(true)}
                      className="btn-gradient text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:scale-105 transition-transform"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Créer ton premier projet
                    </Button>
                  </PermissionGate>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Aucun projet trouvé
                  </h3>
                  <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                    Essaie avec un autre terme de recherche ou filtre
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery("");
                      setTypeFilter("all");
                    }}
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                  >
                    Réinitialiser les filtres
                  </Button>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </div>

      {/* ====== EDIT DIALOG ====== */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setSelectedProject(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="bg-[#16162A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              Modifier le projet
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Mets à jour les informations de ton projet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Nom du projet</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Type</Label>
              <Select value={formType} onValueChange={setFormType} disabled>
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-slate-500 cursor-not-allowed opacity-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#16162A] border-white/10">
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="text-slate-300 focus:text-white focus:bg-white/5"
                    >
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-600">
                Le type ne peut pas être modifié
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setEditOpen(false);
                setSelectedProject(null);
                resetForm();
              }}
              className="text-slate-400 hover:text-white hover:bg-white/5"
            >
              Annuler
            </Button>
            <Button
              onClick={handleEdit}
              disabled={updateProject.isPending || !formName.trim()}
              className="btn-gradient text-white font-semibold rounded-lg"
            >
              {updateProject.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Pencil className="w-4 h-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== DELETE CONFIRMATION (ALERT DIALOG) ====== */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setSelectedProject(null);
        }}
      >
        <AlertDialogContent className="bg-[#16162A] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Supprimer ce projet ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {selectedProject ? (
                <>
                  Tu es sur le point de supprimer{" "}
                  <span className="text-white font-medium">
                    &quot;{selectedProject.name}&quot;
                  </span>
                  . Cette action est irréversible. Toutes les chansons et
                  médias associés seront perdus.
                </>
              ) : (
                "Cette action est irréversible."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              className="bg-red-500/90 text-white hover:bg-red-600 font-semibold"
            >
              {deleteProject.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
