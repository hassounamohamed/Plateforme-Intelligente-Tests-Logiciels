"use client";

import React, { useState } from "react";
import { CasTest, StatutTest } from "@/types";
import EditCasTestModal from "./EditCasTestModal";
import CreateCasTestModal from "./CreateCasTestModal";
import { useAuthStore } from "@/features/auth/store";

interface CasTestsTableProps {
  projectId: number;
  cahierId: number;
  casTests: CasTest[];
  onRefresh: () => void;
  readOnly?: boolean;
  canAssignMember?: boolean;
}

export default function CasTestsTable({
  projectId,
  cahierId,
  casTests,
  onRefresh,
  readOnly = false,
  canAssignMember = false,
}: CasTestsTableProps) {
  const { user } = useAuthStore();
  const [selectedCas, setSelectedCas] = useState<CasTest | null>(null);
  const [assignOnlyMode, setAssignOnlyMode] = useState(false);
  const [selectedReadOnly, setSelectedReadOnly] = useState(false);
  const [filterStatut, setFilterStatut] = useState<StatutTest | "all">("all");
  const [filterSprint, setFilterSprint] = useState<string>("all");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [filterSousModule, setFilterSousModule] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const normalizeName = (value?: string | null) => (value || "").trim().toLowerCase();
  const currentRole = user?.role?.code;
  const currentUserName = normalizeName(user?.nom);

  const canEditCas = (cas: CasTest): boolean => {
    if (readOnly) return false;

    if (currentRole === "TESTEUR_QA" || currentRole === "DEVELOPPEUR") {
      return !!currentUserName && normalizeName(cas.type_utilisateur) === currentUserName;
    }

    return true;
  };

  // Extraire les valeurs uniques pour les filtres
  const sprints = Array.from(
    new Set(casTests.map((c) => c.sprint).filter(Boolean))
  );
  const modules = Array.from(
    new Set(casTests.map((c) => c.module).filter(Boolean))
  );
  const sousModules = Array.from(
    new Set(casTests.map((c) => c.sous_module).filter(Boolean))
  );

  // Filtrer les cas de tests
  const filteredCas = casTests.filter((cas) => {
    if (filterStatut !== "all" && cas.statut_test !== filterStatut)
      return false;
    if (filterSprint !== "all" && cas.sprint !== filterSprint) return false;
    if (filterModule !== "all" && cas.module !== filterModule) return false;
    if (filterSousModule !== "all" && cas.sous_module !== filterSousModule)
      return false;
    if (
      searchQuery &&
      !cas.test_case.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !cas.test_ref.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const showActionsColumn =
    (readOnly && canAssignMember) || (!readOnly && filteredCas.some((cas) => canEditCas(cas)));

  const getStatutBadge = (statut: StatutTest) => {
    const styles: Record<StatutTest, string> = {
      "Non exécuté": "bg-[#283039] text-[#9dabb9]",
      Réussi: "bg-green-500/20 text-green-400",
      Échoué: "bg-red-500/20 text-red-400",
      Bloqué: "bg-orange-500/20 text-orange-400",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[statut]}`}
      >
        {statut}
      </span>
    );
  };

  return (
    <div className="bg-surface-dark rounded-lg border border-[#3b4754]">
      {/* Filtres */}
      <div className="p-4 border-b border-[#3b4754] space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {!readOnly && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              + Nouveau cas 
            </button>
          )}

          {/* Recherche */}
          <input
            type="text"
            placeholder="Rechercher par référence ou titre..."
            className="flex-1 min-w-62.5 px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Filtre Statut */}
          <select
            className="px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value as StatutTest | "all")}
          >
            <option value="all">Tous les statuts</option>
            <option value="Non exécuté">Non exécuté</option>
            <option value="Réussi">Réussi</option>
            <option value="Échoué">Échoué</option>
            <option value="Bloqué">Bloqué</option>
          </select>

          {/* Filtre Sprint */}
          {sprints.length > 0 && (
            <select
              className="px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={filterSprint}
              onChange={(e) => setFilterSprint(e.target.value)}
            >
              <option value="all">Tous les sprints</option>
              {sprints.map((sprint) => (
                <option key={sprint} value={sprint!}>
                  {sprint}
                </option>
              ))}
            </select>
          )}

          {/* Filtre Module */}
          {modules.length > 0 && (
            <select
              className="px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
            >
              <option value="all">Tous les modules</option>
              {modules.map((module) => (
                <option key={module} value={module!}>
                  {module}
                </option>
              ))}
            </select>
          )}

          {/* Filtre Sous-module */}
          {sousModules.length > 0 && (
            <select
              className="px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={filterSousModule}
              onChange={(e) => setFilterSousModule(e.target.value)}
            >
              <option value="all">Tous les sous-modules</option>
              {sousModules.map((sousModule) => (
                <option key={sousModule} value={sousModule!}>
                  {sousModule}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-sm text-[#9dabb9]">
          {filteredCas.length} test{filteredCas.length > 1 ? "s" : ""} affiché
          {filteredCas.length > 1 ? "s" : ""} sur {casTests.length}
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#283039] border-b border-[#3b4754]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9dabb9] uppercase">
                Réf
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9dabb9] uppercase">
                Sprint
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9dabb9] uppercase">
                Module
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9dabb9] uppercase">
                Cas de Test
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9dabb9] uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9dabb9] uppercase">
                Durée
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9dabb9] uppercase">
                Statut
              </th>
              {showActionsColumn && (
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9dabb9] uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3b4754]">
            {filteredCas.length === 0 ? (
              <tr>
                <td colSpan={showActionsColumn ? 8 : 7} className="px-4 py-8 text-center text-[#9dabb9]">
                  Aucun cas de test trouvé
                </td>
              </tr>
            ) : (
              filteredCas.map((cas) => (
                <tr
                  key={cas.id}
                  className="hover:bg-[#283039] cursor-pointer"
                  onClick={() => {
                    setAssignOnlyMode(false);
                    setSelectedReadOnly(readOnly || !canEditCas(cas));
                    setSelectedCas(cas);
                  }}
                >
                  <td className="px-4 py-3 text-sm font-medium text-white">
                    {cas.test_ref}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#9dabb9]">
                    {cas.sprint || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#9dabb9]">
                    {cas.module || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    <div className="max-w-md truncate" title={cas.test_case}>
                      {cas.test_case}
                    </div>
                    {cas.test_purpose && (
                      <div className="text-xs text-[#9dabb9] mt-1 max-w-md truncate">
                        {cas.test_purpose}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#9dabb9]">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        cas.type_test === "Automatisé"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-[#283039] text-[#9dabb9]"
                      }`}
                    >
                      {cas.type_test}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#9dabb9]">
                    {cas.execution_time_seconds !== null && cas.execution_time_seconds !== undefined
                      ? `${cas.execution_time_seconds} s`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {getStatutBadge(cas.statut_test)}
                    {(cas.statut_test === "Échoué" || cas.statut_test === "Bloqué") && (
                      <div className="mt-2 rounded border border-orange-500/40 bg-orange-500/10 px-2 py-1 text-xs">
                        <div className="text-[#9dabb9]">Bug</div>
                        <div className="text-white">
                          <span className="font-semibold">Correction:</span>{" "}
                          {cas.bug_titre_correction || "—"}
                        </div>
                        <div className="text-white">
                          <span className="font-semibold">Tâche:</span>{" "}
                          {cas.bug_nom_tache || "—"}
                        </div>
                      </div>
                    )}
                  </td>
                  {showActionsColumn && (
                    <td className="px-4 py-3 text-sm">
                      {readOnly && canAssignMember ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignOnlyMode(true);
                            setSelectedReadOnly(false);
                            setSelectedCas(cas);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Assigner
                        </button>
                      ) : (
                        canEditCas(cas) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignOnlyMode(false);
                              setSelectedReadOnly(false);
                              setSelectedCas(cas);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Modifier
                          </button>
                        )
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal  */}
      {selectedCas && (
        <EditCasTestModal
          projectId={projectId}
          cahierId={cahierId}
          casTest={selectedCas}
          isOpen={!!selectedCas}
          onClose={() => {
            setSelectedCas(null);
            setAssignOnlyMode(false);
            setSelectedReadOnly(false);
          }}
          readOnly={selectedReadOnly}
          assignOnly={assignOnlyMode}
          canAssignMember={canAssignMember}
          onSuccess={() => {
            onRefresh();
            setSelectedCas(null);
            setAssignOnlyMode(false);
            setSelectedReadOnly(false);
          }}
        />
      )}

      <CreateCasTestModal
        projectId={projectId}
        cahierId={cahierId}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
}
