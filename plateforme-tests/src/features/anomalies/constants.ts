import { AnomalieStatut } from "@/types";

export const ANOMALIE_STATUT_LABELS: Record<AnomalieStatut, string> = {
  NOUVEAU: "Nouveau",
  EN_COURS: "En cours",
  REOUVERT: "Réouvert",
  RESOLU: "Résolu",
};

export const LIFECYCLE_STEPS: Array<{
  key: AnomalieStatut | "REOUVERT";
  label: string;
}> = [
  { key: "NOUVEAU", label: "Signalée" },
  { key: "EN_COURS", label: "En correction" },
  { key: "RESOLU", label: "Résolue" },
];

export function statutBadgeClass(statut: string): string {
  switch (statut) {
    case "RESOLU":
      return "bg-emerald-500/20 text-emerald-400";
    case "EN_COURS":
      return "bg-blue-500/20 text-blue-400";
    case "REOUVERT":
      return "bg-orange-500/20 text-orange-400";
    default:
      return "bg-red-500/20 text-red-400";
  }
}

export function severiteTextClass(severite: string): string {
  switch (severite) {
    case "CRITIQUE":
      return "text-red-400";
    case "MINEURE":
      return "text-muted-foreground";
    default:
      return "text-amber-400";
  }
}

export function isDeveloperRole(roleCode: string): boolean {
  const code = roleCode.toUpperCase();
  return code === "DEVELOPPEUR" || code === "DEVELOPER";
}

export function lifecycleStepIndex(statut: AnomalieStatut): number {
  if (statut === "RESOLU") return 2;
  if (statut === "EN_COURS" || statut === "REOUVERT") return 1;
  return 0;
}
