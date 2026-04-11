"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { User } from "@/types";
import { getAvailableMembers } from "@/features/projects/api";
import { getMeApi } from "@/features/auth/api";

interface AssignMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (memberIds: number[]) => void;
  projectName: string;
  currentMemberIds?: number[];
}

export function AssignMembersModal({
  isOpen,
  onClose,
  onAssign,
  projectName,
  currentMemberIds = [],
}: AssignMembersModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>(currentMemberIds);
  const [lockedMemberIds, setLockedMemberIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadUsers(currentMemberIds);
      setSearchTerm("");
    }
  }, [isOpen, currentMemberIds]);

  const loadUsers = async (initialSelectedIds: number[] = []) => {
    setIsLoading(true);
    try {
      const [usersData, me] = await Promise.all([
        getAvailableMembers(),
        getMeApi().catch(() => null),
      ]);

      const normalizedUsers = Array.isArray(usersData) ? (usersData as User[]) : [];
      const currentUserId = me?.id;

      const eligibleUsers = normalizedUsers.filter((user) => {
        const isActive = typeof user.actif === "boolean" ? user.actif : true;
        const isNotCurrentUser = currentUserId ? user.id !== currentUserId : true;
        return isActive && isNotCurrentUser;
      });

      setUsers(eligibleUsers);

      const eligibleIds = new Set(eligibleUsers.map((user) => user.id));
      setSelectedMemberIds(initialSelectedIds.filter((id) => eligibleIds.has(id)));
      setLockedMemberIds(initialSelectedIds.filter((id) => !eligibleIds.has(id)));
    } catch (error) {
      console.error("Failed to load users:", error);
      setUsers([]);
      setSelectedMemberIds([]);
      setLockedMemberIds([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUser = (userId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    onAssign(Array.from(new Set([...lockedMemberIds, ...selectedMemberIds])));
    onClose();
  };

  const filteredUsers = users.filter((user) =>
    user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assigner des Membres">
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-linear-to-r from-blue-500/10 via-cyan-500/5 to-emerald-500/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Projet</p>
              <p className="text-foreground text-sm font-semibold">{projectName || "Projet sans nom"}</p>
            </div>
            <span className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300">
              {selectedMemberIds.length} sélectionné(s)
            </span>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un utilisateur actif..."
            className="w-full bg-(--surface) border border-border rounded-xl pl-10 pr-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[20px]">
            search
          </span>
        </div>

        <div className="max-h-[46vh] overflow-y-auto rounded-xl border border-border bg-(--surface) p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-muted text-[64px]">
                person_off
              </span>
              <p className="text-muted mt-4">Aucun utilisateur actif trouvé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const isSelected = selectedMemberIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleToggleUser(user.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-transparent border-transparent hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          isSelected
                            ? "bg-primary/25 text-primary"
                            : "bg-slate-600/20 text-slate-200"
                        }`}
                      >
                        {getInitials(user.nom)}
                      </div>
                      <div className="flex-1">
                        <div className="text-foreground font-medium">{user.nom}</div>
                        <div className="text-muted text-sm">{user.email}</div>
                      </div>
                      {user.role && (
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/20">
                          {user.role.nom}
                        </span>
                      )}
                    </div>
                    <div
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-muted"
                      }`}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-white text-[16px]">
                          check
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-between gap-3">

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-500/20 hover:bg-slate-500/30 text-foreground text-sm font-bold rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedMemberIds.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">group_add</span>
              Assigner ({selectedMemberIds.length})
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
