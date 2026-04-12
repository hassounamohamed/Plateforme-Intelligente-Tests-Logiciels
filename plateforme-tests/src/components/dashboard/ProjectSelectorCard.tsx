type ProjectOption = {
  id: number;
  nom: string;
};

type ProjectSelectorCardProps = {
  projects: ProjectOption[];
  selectedProjectId: number | null;
  selectedProjectName?: string | null;
  onSelectProject: (projectId: number) => void;
  badgeText?: string;
  title?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function ProjectSelectorCard({
  projects,
  selectedProjectId,
  selectedProjectName,
  onSelectProject,
  badgeText = "Consultation des rapports QA",
  title = "Projet actif",
  description = "Selectionnez un projet pour afficher son rapport, puis changez-en a tout moment sans quitter la page.",
  placeholder = "-- Selectionnez un projet --",
  disabled = false,
}: ProjectSelectorCardProps) {
  const isDisabled = disabled || projects.length === 0;

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-white via-slate-50 to-sky-50 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.10)] dark:border-[#3b4754] dark:from-[#11161d] dark:via-[#151b23] dark:to-[#1b2430] dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/15 blur-3xl dark:bg-primary/10" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-cyan-500/15 blur-3xl dark:bg-cyan-500/10" />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-[#9dabb9]">
            <span className="material-symbols-outlined text-[16px]">assessment</span>
            {badgeText}
          </div>
          <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-[#9dabb9]">{description}</p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
              {selectedProjectName ? `Actuel: ${selectedProjectName}` : "Aucun projet selectionne"}
            </span>
            <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-slate-600 dark:border-[#3b4754] dark:bg-[#0f141b] dark:text-[#9dabb9]">
              {projects.length} projet{projects.length > 1 ? "s" : ""} disponible{projects.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="w-full lg:max-w-md">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-white">Projet</label>
          <div className="relative">
            <select
              value={selectedProjectId ?? ""}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (!Number.isNaN(next) && next > 0) {
                  onSelectProject(next);
                }
              }}
              disabled={isDisabled}
              className="peer h-13 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60 dark:border-[#3b4754] dark:bg-[#0f141b] dark:text-white dark:placeholder:text-[#66758a]"
            >
              <option value="">{placeholder}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.nom}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors peer-focus:text-slate-800 dark:text-[#9dabb9] dark:peer-focus:text-white">
              <span className="material-symbols-outlined text-[20px]">expand_more</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
