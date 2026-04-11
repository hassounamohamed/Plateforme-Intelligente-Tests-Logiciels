"use client";

import { useState, useEffect } from "react";
import { useCallback, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import {
  getGenerationItems,
  getGenerationDetail,
  updateItemStatus,
  updateItem,
  applyGeneration,
  rejectGeneration,
  startGeneration,
} from "@/features/ai-generation/api";
import {
  AIGeneratedItem,
  AIItemStatus,
  UpdateAIItemPayload,
  ApplyGenerationResult,
  AIPriority,
} from "@/types";

const sidebarLinks = [
  { href: ROUTES.PRODUCT_OWNER, icon: "dashboard", label: "Dashboard" },
  { href: `${ROUTES.PRODUCT_OWNER}/projects`, icon: "folder", label: "Projets" },
  { href: `${ROUTES.PRODUCT_OWNER}/backlog`, icon: "list", label: "Backlog" },
  { href: `${ROUTES.PRODUCT_OWNER}/epics`, icon: "content_cut", label: "Epics" },
  { href: `${ROUTES.PRODUCT_OWNER}/sprints`, icon: "event", label: "Sprints" },
    { href: `${ROUTES.PRODUCT_OWNER}/validation-tests`, icon: "check_circle", label: "Validation Tests" },
  { href: `${ROUTES.PRODUCT_OWNER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
  { href: `${ROUTES.PRODUCT_OWNER}/roadmap`, icon: "map", label: "Roadmap" },
  { href: `${ROUTES.PRODUCT_OWNER}/profile`, icon: "account_circle", label: "Mon Profil" },
];

const POLL_INTERVAL = 2500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function updateItemInTree(
  tree: AIGeneratedItem[],
  updated: AIGeneratedItem
): AIGeneratedItem[] {
  return tree.map((item) => {
    if (item.id === updated.id)
      return { ...updated, children: item.children ?? [] };
    return {
      ...item,
      children: updateItemInTree(item.children ?? [], updated),
    };
  });
}

function flattenItems(tree: AIGeneratedItem[]): AIGeneratedItem[] {
  const result: AIGeneratedItem[] = [];
  for (const item of tree) {
    result.push(item);
    if (item.children?.length) result.push(...flattenItems(item.children));
  }
  return result;
}

function parseAcceptanceCriteria(ac: string | null): string[] {
  if (!ac) return [];
  try {
    const parsed = JSON.parse(ac);
    return Array.isArray(parsed) ? parsed : [ac];
  } catch {
    return [ac];
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIBacklogReviewPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generationId = Number(params.generationId);
  const projectId = Number(searchParams.get("projectId"));

  const [items, setItems] = useState<AIGeneratedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [applyResult, setApplyResult] = useState<ApplyGenerationResult | null>(
    null
  );
  const [editingItem, setEditingItem] = useState<AIGeneratedItem | null>(null);
  const [editForm, setEditForm] = useState<UpdateAIItemPayload>({});

  useEffect(() => {
    if (generationId && projectId) loadItems();
  }, [generationId, projectId]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPoll = useCallback((projectIdValue: number, generationIdValue: number) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const detail = await getGenerationDetail(projectIdValue, generationIdValue);
        if (
          detail.status === "completed" ||
          detail.status === "approved" ||
          detail.status === "failed" ||
          detail.status === "rejected"
        ) {
          if (pollRef.current) clearInterval(pollRef.current);
          if (detail.status === "completed" || detail.status === "approved") {
            await loadItems();
          }
        }
      } catch (err) {
        console.error("Erreur polling génération:", err);
      }
    }, POLL_INTERVAL);
  }, []);

  useEffect(() => {
    if (!projectId || !generationId) return;
    startPoll(projectId, generationId);
  }, [projectId, generationId, startPoll]);


  const loadItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getGenerationItems(projectId, generationId);
      setItems(data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(
        e.response?.data?.detail || "Erreur lors du chargement des items."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (
    item: AIGeneratedItem,
    status: AIItemStatus
  ) => {
    const newStatus: AIItemStatus =
      item.status === status ? "draft" : status;
    try {
      const updated = await updateItemStatus(
        projectId,
        generationId,
        item.id,
        newStatus
      );
      setItems((prev) => updateItemInTree(prev, updated));
    } catch (err) {
      console.error("Erreur changement statut:", err);
    }
  };

  const openEdit = (item: AIGeneratedItem) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      description: item.description ?? "",
      acceptance_criteria: item.acceptance_criteria ?? "",
      priority: item.priority ?? undefined,
      story_points: item.story_points ?? undefined,
      sprint: item.sprint ?? undefined,
      duration: item.duration ?? "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      const updated = await updateItem(
        projectId,
        generationId,
        editingItem.id,
        editForm
      );
      setItems((prev) => updateItemInTree(prev, updated));
      setEditingItem(null);
    } catch (err) {
      console.error("Erreur modification:", err);
    }
  };

  const handleApproveAll = async () => {
    const all = flattenItems(items).filter((i) => i.status === "draft");
    for (const item of all) {
      try {
        const updated = await updateItemStatus(
          projectId,
          generationId,
          item.id,
          "approved"
        );
        setItems((prev) => updateItemInTree(prev, updated));
      } catch (err) {
        console.error("Erreur approbation:", err);
      }
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    setError(null);
    try {
      const result = await applyGeneration(projectId, generationId);
      setApplyResult(result);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(
        e.response?.data?.detail ||
          "Erreur lors de l'application au backlog."
      );
    } finally {
      setIsApplying(false);
    }
  };

  const handleRejectGeneration = async () => {
    setIsRejecting(true);
    setError(null);
    try {
      await rejectGeneration(projectId, generationId);
      alert("La tentative IA a été refusée.");
      router.push(
        `${ROUTES.PRODUCT_OWNER}/backlog?tab=ai${projectId ? `&projectId=${projectId}` : ""}`
      );
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Erreur lors du rejet de la génération.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);
    try {
      const nextGeneration = await startGeneration(projectId);
      router.push(
        `${ROUTES.PRODUCT_OWNER}/ai-backlog?projectId=${projectId}&generationId=${nextGeneration.id}`
      );
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Erreur lors de la régénération.");
    } finally {
      setIsRegenerating(false);
    }
  };

  // ── Badge helpers ────────────────────────────────────────────────────────────

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "modified":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "approved": return "Approuvé";
      case "rejected": return "Rejeté";
      case "modified": return "Modifié";
      default: return "Brouillon";
    }
  };

  const priorityBadge = (priority: string | null) => {
    switch (priority) {
      case "High":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "module": return "view_module";
      case "epic": return "content_cut";
      default: return "person";
    }
  };

  const typeBg = (type: string) => {
    switch (type) {
      case "module": return "bg-purple-500/20 text-purple-400";
      case "epic": return "bg-blue-500/20 text-blue-400";
      default: return "bg-green-500/20 text-green-400";
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "module": return "Module";
      case "epic": return "Epic";
      default: return "User Story";
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────────

  const all = flattenItems(items);
  const approvedCount = all.filter((i) => i.status === "approved").length;
  const rejectedCount = all.filter((i) => i.status === "rejected").length;
  const totalCount = all.length;

  // ── Recursive renderer ────────────────────────────────────────────────────────

  const renderItem = (item: AIGeneratedItem, depth = 0): React.ReactNode => {
    const isRejected = item.status === "rejected";
    return (
      <div
        key={item.id}
        className={depth > 0 ? "ml-6 border-l border-slate-200 dark:border-[#3b4754] pl-4" : ""}
      >
        <div
          className={`bg-white dark:bg-surface-dark border rounded-xl p-4 mb-3 transition-opacity ${
            isRejected
              ? "opacity-40 border-red-500/20"
              : "border-slate-200 dark:border-[#3b4754] hover:border-primary/40"
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Type icon */}
            <div
              className={`flex items-center justify-center h-9 w-9 rounded-lg shrink-0 ${typeBg(item.type)}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {typeIcon(item.type)}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                {/* Labels */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${typeBg(item.type).split(" ")[1]}`}
                  >
                    {typeLabel(item.type)}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-xs rounded border ${statusBadge(item.status)}`}
                  >
                    {statusLabel(item.status)}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(item)}
                    title="Modifier"
                    className="flex items-center justify-center h-7 w-7 rounded-lg bg-slate-100 dark:bg-[#283039] hover:bg-[#3b4754] text-slate-500 dark:text-[#9dabb9] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      edit
                    </span>
                  </button>
                  <button
                    onClick={() => handleStatusChange(item, "approved")}
                    title="Approuver"
                    className={`flex items-center justify-center h-7 w-7 rounded-lg transition-colors ${
                      item.status === "approved"
                        ? "bg-green-500 text-white"
                        : "bg-slate-100 dark:bg-[#283039] hover:bg-green-500/20 text-slate-500 dark:text-[#9dabb9] hover:text-green-400"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      check
                    </span>
                  </button>
                  <button
                    onClick={() => handleStatusChange(item, "rejected")}
                    title="Rejeter"
                    className={`flex items-center justify-center h-7 w-7 rounded-lg transition-colors ${
                      item.status === "rejected"
                        ? "bg-red-500 text-white"
                        : "bg-slate-100 dark:bg-[#283039] hover:bg-red-500/20 text-slate-500 dark:text-[#9dabb9] hover:text-red-400"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      close
                    </span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <p className="text-white font-medium mt-1.5 text-sm leading-snug">
                {item.title}
              </p>

              {/* User Story chips */}
              {item.type === "user_story" && (
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  {item.priority && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded border ${priorityBadge(item.priority)}`}
                    >
                      {item.priority}
                    </span>
                  )}
                  {item.story_points != null && (
                    <div className="flex items-center gap-1 text-slate-500 dark:text-[#9dabb9] text-xs">
                      <span className="material-symbols-outlined text-[13px]">
                        star
                      </span>
                      {item.story_points} pts
                    </div>
                  )}
                  {item.sprint != null && (
                    <div className="flex items-center gap-1 text-slate-500 dark:text-[#9dabb9] text-xs">
                      <span className="material-symbols-outlined text-[13px]">
                        event
                      </span>
                      Sprint {item.sprint}
                    </div>
                  )}
                  {item.duration && (
                    <div className="flex items-center gap-1 text-slate-500 dark:text-[#9dabb9] text-xs">
                      <span className="material-symbols-outlined text-[13px]">
                        schedule
                      </span>
                      {item.duration}
                    </div>
                  )}
                </div>
              )}

              {/* Acceptance criteria */}
              {item.type === "user_story" && item.acceptance_criteria && (
                <ul className="mt-2 flex flex-col gap-1">
                  {parseAcceptanceCriteria(item.acceptance_criteria)
                    .slice(0, 3)
                    .map((c, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-[#9dabb9]"
                      >
                        <span className="material-symbols-outlined text-[12px] text-green-400 mt-0.5 shrink-0">
                          check_small
                        </span>
                        {c}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Children */}
        {item.children && item.children.length > 0 && (
          <div className="mb-3">
            {item.children.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Product Owner"
          subtitle="Agile & QA Platform"
          icon="account_tree"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title="Révision du Backlog IA"
          subtitle="Approuvez, modifiez ou rejetez les éléments générés avant de les appliquer"
          actions={
            <Link
              href={`${ROUTES.PRODUCT_OWNER}/backlog?tab=ai`}
              className="flex items-center gap-1.5 text-slate-500 dark:text-[#9dabb9] hover:text-white bg-slate-100 dark:bg-[#283039] hover:bg-[#3b4754] px-3 py-2 rounded-lg text-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                arrow_back
              </span>
              Retour
            </Link>
          }
        />
      }
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* ── Apply success ──────────────────────────────────────────────── */}
        {applyResult && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-green-400 text-5xl">
                check_circle
              </span>
              <div>
                <h2 className="text-white font-bold text-xl">
                  Backlog appliqué avec succès !
                </h2>
                <p className="text-slate-500 dark:text-[#9dabb9] text-sm">
                  Les éléments ont été créés dans votre projet.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Modules créés", value: applyResult.modules_created, icon: "view_module" },
                { label: "Epics créés", value: applyResult.epics_created, icon: "content_cut" },
                { label: "User Stories", value: applyResult.stories_created, icon: "person" },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  className="bg-slate-100 dark:bg-[#283039] rounded-lg p-4 text-center"
                >
                  <span className="material-symbols-outlined text-primary text-2xl">
                    {icon}
                  </span>
                  <div className="text-2xl font-bold text-white mt-1">
                    {value}
                  </div>
                  <div className="text-slate-500 dark:text-[#9dabb9] text-sm">{label}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Link
                href={`${ROUTES.PRODUCT_OWNER}/backlog`}
                className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">list</span>
                Voir le Backlog
              </Link>
              <Link
                href={`${ROUTES.PRODUCT_OWNER}/epics`}
                className="flex items-center gap-2 bg-slate-100 dark:bg-[#283039] hover:bg-[#3b4754] text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">content_cut</span>
                Voir les Epics
              </Link>
            </div>
          </div>
        )}

        {/* ── Stats + action bar ─────────────────────────────────────────── */}
        {!isLoading && !applyResult && (
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-5 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-[#9dabb9] text-sm">Total :</span>
                  <span className="text-white font-bold">{totalCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-slate-500 dark:text-[#9dabb9] text-sm">Approuvés :</span>
                  <span className="text-green-400 font-bold">
                    {approvedCount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-slate-500 dark:text-[#9dabb9] text-sm">Rejetés :</span>
                  <span className="text-red-400 font-bold">{rejectedCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleApproveAll}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm font-medium transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    done_all
                  </span>
                  Tout approuver
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isApplying || approvedCount === 0}
                  className="flex items-center gap-2 bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  {isApplying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Application…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">
                        publish
                      </span>
                      Appliquer au Backlog ({approvedCount})
                    </>
                  )}
                </button>
                  <button
                    type="button"
                    onClick={handleRejectGeneration}
                    disabled={isRejecting || isRegenerating || isApplying}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isRejecting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" />
                        Rejet...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">
                          block
                        </span>
                        Refuser la tentative
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={isRegenerating || isRejecting || isApplying}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#283039] hover:bg-[#3b4754] text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isRegenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Régénération...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">
                          refresh
                        </span>
                        Régénérer
                      </>
                    )}
                  </button>
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <span className="material-symbols-outlined text-red-400 text-[18px]">
                  error
                </span>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            <p className="text-slate-500 dark:text-[#9dabb9] text-sm">
              Chargement des items générés…
            </p>
          </div>
        )}

        {/* ── Tree ──────────────────────────────────────────────────────── */}
        {!isLoading && !applyResult && items.length > 0 && (
          <div className="flex flex-col gap-2">
            {items.map((item) => renderItem(item))}
          </div>
        )}

        {/* ── Empty ─────────────────────────────────────────────────────── */}
        {!isLoading && !applyResult && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-500 dark:text-[#9dabb9]">
              inbox
            </span>
            <p className="text-slate-500 dark:text-[#9dabb9]">Aucun item généré.</p>
            <Link
              href={`${ROUTES.PRODUCT_OWNER}/backlog?tab=ai`}
              className="flex items-center gap-2 text-primary hover:underline text-sm"
            >
              ← Retour à la génération
            </Link>
          </div>
        )}
      </div>

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-200 dark:border-[#3b4754] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-[#3b4754]">
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center h-8 w-8 rounded-lg ${typeBg(editingItem.type)}`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {typeIcon(editingItem.type)}
                  </span>
                </div>
                <h2 className="text-white font-bold">
                  Modifier — {typeLabel(editingItem.type)}
                </h2>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-500 dark:text-[#9dabb9] hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-slate-500 dark:text-[#9dabb9] text-sm font-bold mb-1.5 block">
                  Titre
                </label>
                <input
                  type="text"
                  value={editForm.title ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="w-full bg-slate-100 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-[#9dabb9] text-sm font-bold mb-1.5 block">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.description ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full bg-slate-100 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {editingItem.type === "user_story" && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold mb-1 block">
                        Priorité
                      </label>
                      <select
                        value={editForm.priority ?? "Medium"}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            priority: e.target.value as AIPriority,
                          })
                        }
                        className="w-full bg-slate-100 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold mb-1 block">
                        Story Points
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={13}
                        value={editForm.story_points ?? ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            story_points: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-100 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold mb-1 block">
                        Sprint
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={editForm.sprint ?? ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            sprint: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-100 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold mb-1 block">
                      Durée estimée
                    </label>
                    <input
                      type="text"
                      placeholder="ex: 4h"
                      value={editForm.duration ?? ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, duration: e.target.value })
                      }
                      className="w-full bg-slate-100 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold mb-1 block">
                      Critères d&apos;acceptation (JSON)
                    </label>
                    <textarea
                      rows={3}
                      placeholder='["Critère 1", "Critère 2"]'
                      value={editForm.acceptance_criteria ?? ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          acceptance_criteria: e.target.value,
                        })
                      }
                      className="w-full bg-slate-100 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary resize-none font-mono"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-[#3b4754]">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#283039] hover:bg-[#3b4754] text-white text-sm transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-blue-600 text-white text-sm font-medium transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
