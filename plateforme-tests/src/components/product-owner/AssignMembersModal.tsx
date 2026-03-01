"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { User } from "@/types";
import { getAvailableMembers } from "@/features/projects/api";

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
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setSelectedMemberIds(currentMemberIds);
    }
  }, [isOpen, currentMemberIds]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const usersData = await getAvailableMembers();
      // Les utilisateurs sont déjà filtrés côté backend (pas de SUPER_ADMIN)
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to load users:", error);
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
    onAssign(selectedMemberIds);
    onClose();
  };

  const filteredUsers = users.filter((user) =>
    user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assigner des Membres">
      <div className="bg-surface-dark border border-[#3b4754] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#3b4754]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl font-bold text-white">Assigner des Membres</h3>
            <button
              onClick={onClose}
              className="text-[#9dabb9] hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>
          </div>
          <p className="text-[#9dabb9] text-sm">
            Projet: <span className="text-white font-medium">{projectName}</span>
          </p>
        </div>

        {/* Search */}
        <div className="px-6 pt-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="w-full bg-[#1e293b] border border-[#3b4754] rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9dabb9] text-[20px]">
              search
            </span>
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[#9dabb9] text-[64px]">
                person_off
              </span>
              <p className="text-[#9dabb9] mt-4">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const isSelected = selectedMemberIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleToggleUser(user.id)}
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-[#1e293b] border-[#3b4754] hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          isSelected ? "bg-primary/20" : "bg-[#283039]"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[24px] ${
                            isSelected ? "text-primary" : "text-[#9dabb9]"
                          }`}
                        >
                          person
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{user.nom}</div>
                        <div className="text-[#9dabb9] text-sm">{user.email}</div>
                      </div>
                      {user.role && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                          {user.role.nom}
                        </span>
                      )}
                    </div>
                    <div
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-[#9dabb9]"
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

        {/* Footer */}
        <div className="p-6 border-t border-[#3b4754] flex items-center justify-between">
          <div className="text-sm text-[#9dabb9]">
            {selectedMemberIds.length} membre(s) sélectionné(s)
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-[#283039] hover:bg-[#344150] text-white text-sm font-bold rounded-lg transition-colors"
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
