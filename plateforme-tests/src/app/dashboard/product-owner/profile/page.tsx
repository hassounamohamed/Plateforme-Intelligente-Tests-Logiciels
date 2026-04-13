"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { useProfile } from "@/features/profile/hooks";
import { APIKeyManagement } from "@/features/profile/APIKeyManagement";

export default function ProfilePage() {
  const { profile, isLoading, error, updateProfile, changePassword } = useProfile();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    nom: "",
    telephone: "",
    ancienMotDePasse: "",
    nouveauMotDePasse: "",
    confirmerMotDePasse: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        nom: profile.nom,
        telephone: profile.telephone || "",
        ancienMotDePasse: "",
        nouveauMotDePasse: "",
        confirmerMotDePasse: "",
      });
    }
  }, [profile]);

  const sidebarLinks = [
    { href: ROUTES.PRODUCT_OWNER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.PRODUCT_OWNER}/projects`, icon: "folder", label: "Projets" },
    { href: `${ROUTES.PRODUCT_OWNER}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.PRODUCT_OWNER}/epics`, icon: "content_cut", label: "Epics" },
    { href: `${ROUTES.PRODUCT_OWNER}/sprints`, icon: "event", label: "Sprints" },
        { href: `${ROUTES.PRODUCT_OWNER}/cahier-tests`, icon: "check_circle", label: "Cahier de Tests" },
    { href: `${ROUTES.PRODUCT_OWNER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.PRODUCT_OWNER}/roadmap`, icon: "map", label: "Roadmap" },
    { href: `${ROUTES.PRODUCT_OWNER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await updateProfile({
      nom: formData.nom,
      telephone: formData.telephone,
    });

    if (success) {
      alert("Profil mis à jour avec succès");
      setIsEditing(false);
    } else {
      alert(error || "Erreur lors de la mise à jour du profil");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.nouveauMotDePasse !== formData.confirmerMotDePasse) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }

    if (!formData.ancienMotDePasse || !formData.nouveauMotDePasse) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    const success = await changePassword({
      ancienMotDePasse: formData.ancienMotDePasse,
      nouveauMotDePasse: formData.nouveauMotDePasse,
    });

    if (success) {
      alert("Mot de passe modifié avec succès");
      setFormData({
        ...formData,
        ancienMotDePasse: "",
        nouveauMotDePasse: "",
        confirmerMotDePasse: "",
      });
    } else {
      alert(error || "Erreur lors du changement de mot de passe");
    }
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
          title="Mon Profil"
          subtitle="Gérer mes informations personnelles et sécurité"
        />
      }
    >
      <div className="max-w-350 mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-white text-lg">Chargement du profil...</div>
          </div>
        ) : !profile ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-red-400 text-lg">
              Erreur lors du chargement du profil
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6 text-center">
              <div className="bg-primary/20 rounded-full h-32 w-32 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-[80px]">
                  account_circle
                </span>
              </div>
              <h3 className="text-white text-xl font-bold mb-1">
                {profile.nom}
              </h3>
              <p className="text-slate-500 dark:text-[#9dabb9] text-sm mb-4">{profile.email}</p>
              {profile.role && (
                <div className="inline-flex px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold mb-4">
                  {profile.role.nom}
                </div>
              )}
              <div className="border-t border-[#283039] pt-4 mt-4 space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-[#9dabb9]">Statut</span>
                  <span className={`font-medium ${profile.actif ? 'text-green-400' : 'text-red-400'}`}>
                    {profile.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                {profile.telephone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-[#9dabb9]">Téléphone</span>
                    <span className="text-white font-medium">
                      {profile.telephone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl overflow-hidden">
              <div className="p-5 border-b border-[#283039] flex items-center justify-between">
                <div>
                  <h3 className="text-white text-lg font-bold">Informations Personnelles</h3>
                  <p className="text-slate-500 dark:text-[#9dabb9] text-xs mt-1">
                    Gérer vos données personnelles
                  </p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Modifier
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-bold rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    Annuler
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    disabled={!isEditing}
                    className="w-full bg-[#1e293b] border border-slate-200 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full bg-[#1e293b] border border-slate-200 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-slate-500 dark:text-[#9dabb9] text-sm focus:outline-none cursor-not-allowed opacity-50"
                  />
                  <p className="text-slate-500 dark:text-[#9dabb9] text-xs mt-1">
                    L&apos;email ne peut pas être modifié
                  </p>
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    disabled={!isEditing}
                    className="w-full bg-[#1e293b] border border-slate-200 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                {isEditing && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      Enregistrer
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl overflow-hidden">
              <div className="p-5 border-b border-[#283039]">
                <h3 className="text-white text-lg font-bold">Changer le Mot de Passe</h3>
                <p className="text-slate-500 dark:text-[#9dabb9] text-xs mt-1">
                  Assurez-vous d&apos;utiliser un mot de passe fort
                </p>
              </div>
              <form onSubmit={handlePasswordChange} className="p-5 space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    value={formData.ancienMotDePasse}
                    onChange={(e) => setFormData({ ...formData, ancienMotDePasse: e.target.value })}
                    className="w-full bg-[#1e293b] border border-slate-200 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={formData.nouveauMotDePasse}
                    onChange={(e) => setFormData({ ...formData, nouveauMotDePasse: e.target.value })}
                    className="w-full bg-[#1e293b] border border-slate-200 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={formData.confirmerMotDePasse}
                    onChange={(e) => setFormData({ ...formData, confirmerMotDePasse: e.target.value })}
                    className="w-full bg-[#1e293b] border border-slate-200 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    Changer le Mot de Passe
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6">
              <APIKeyManagement />
            </div>
          </div>
        </div>
        )}
      </div>
    </DashboardLayout>
  );
}
