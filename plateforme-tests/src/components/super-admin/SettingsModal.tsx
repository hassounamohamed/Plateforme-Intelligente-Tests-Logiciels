"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<"general" | "security" | "email" | "backup">(
    "general"
  );

  const [generalSettings, setGeneralSettings] = useState({
    platformName: "Plateforme Intelligente Tests Logiciels",
    timezone: "Europe/Paris",
    language: "fr",
    maintenanceMode: false,
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: "30",
    passwordMinLength: "8",
    requireSpecialChar: true,
    require2FA: false,
    maxLoginAttempts: "5",
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "smtp.example.com",
    smtpPort: "587",
    smtpUser: "noreply@example.com",
    enableNotifications: true,
  });

  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: "daily",
    retentionDays: "30",
  });

  const handleSave = () => {
    // TODO: Sauvegarder les paramètres via l'API
    console.log("Saving settings...", {
      general: generalSettings,
      security: securitySettings,
      email: emailSettings,
      backup: backupSettings,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Paramètres de la Plateforme" size="xl">
      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-48 shrink-0 space-y-1">
          <button
            onClick={() => setActiveSection("general")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeSection === "general"
                ? "bg-primary/20 text-primary"
                : "text-[#9dabb9] hover:bg-[#283039] hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-sm font-medium">Général</span>
          </button>

          <button
            onClick={() => setActiveSection("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeSection === "security"
                ? "bg-primary/20 text-primary"
                : "text-[#9dabb9] hover:bg-[#283039] hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">security</span>
            <span className="text-sm font-medium">Sécurité</span>
          </button>

          <button
            onClick={() => setActiveSection("email")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeSection === "email"
                ? "bg-primary/20 text-primary"
                : "text-[#9dabb9] hover:bg-[#283039] hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">email</span>
            <span className="text-sm font-medium">Email</span>
          </button>

          <button
            onClick={() => setActiveSection("backup")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeSection === "backup"
                ? "bg-primary/20 text-primary"
                : "text-[#9dabb9] hover:bg-[#283039] hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">backup</span>
            <span className="text-sm font-medium">Sauvegarde</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeSection === "general" && (
            <>
              <div>
                <h3 className="text-white text-lg font-bold mb-4">Paramètres Généraux</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Nom de la plateforme
                    </label>
                    <Input
                      type="text"
                      value={generalSettings.platformName}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          platformName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Fuseau horaire
                      </label>
                      <select
                        value={generalSettings.timezone}
                        onChange={(e) =>
                          setGeneralSettings({
                            ...generalSettings,
                            timezone: e.target.value,
                          })
                        }
                        className="w-full bg-[#1e293b] border border-[#3b4754] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Europe/Paris">Europe/Paris</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Asia/Tokyo">Asia/Tokyo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Langue
                      </label>
                      <select
                        value={generalSettings.language}
                        onChange={(e) =>
                          setGeneralSettings({
                            ...generalSettings,
                            language: e.target.value,
                          })
                        }
                        className="w-full bg-[#1e293b] border border-[#3b4754] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-[#1e293b] border border-[#3b4754] rounded-lg">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={generalSettings.maintenanceMode}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          maintenanceMode: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-primary bg-[#283039] border-[#3b4754] rounded focus:ring-primary"
                    />
                    <div>
                      <label htmlFor="maintenanceMode" className="text-sm text-white font-medium">
                        Mode Maintenance
                      </label>
                      <p className="text-xs text-[#9dabb9]">
                        Active le mode maintenance et bloque l'accès aux utilisateurs
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === "security" && (
            <>
              <div>
                <h3 className="text-white text-lg font-bold mb-4">Paramètres de Sécurité</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Timeout de session (minutes)
                    </label>
                    <Input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          sessionTimeout: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Longueur minimale du mot de passe
                    </label>
                    <Input
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordMinLength: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Tentatives de connexion maximales
                    </label>
                    <Input
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          maxLoginAttempts: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="requireSpecialChar"
                        checked={securitySettings.requireSpecialChar}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            requireSpecialChar: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-primary bg-[#283039] border-[#3b4754] rounded focus:ring-primary"
                      />
                      <label htmlFor="requireSpecialChar" className="text-sm text-white">
                        Exiger des caractères spéciaux dans les mots de passe
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="require2FA"
                        checked={securitySettings.require2FA}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            require2FA: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-primary bg-[#283039] border-[#3b4754] rounded focus:ring-primary"
                      />
                      <label htmlFor="require2FA" className="text-sm text-white">
                        Activer l'authentification à deux facteurs (2FA)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === "email" && (
            <>
              <div>
                <h3 className="text-white text-lg font-bold mb-4">Configuration Email</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Serveur SMTP
                      </label>
                      <Input
                        type="text"
                        value={emailSettings.smtpHost}
                        onChange={(e) =>
                          setEmailSettings({
                            ...emailSettings,
                            smtpHost: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Port SMTP
                      </label>
                      <Input
                        type="text"
                        value={emailSettings.smtpPort}
                        onChange={(e) =>
                          setEmailSettings({
                            ...emailSettings,
                            smtpPort: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Utilisateur SMTP
                    </label>
                    <Input
                      type="email"
                      value={emailSettings.smtpUser}
                      onChange={(e) =>
                        setEmailSettings({
                          ...emailSettings,
                          smtpUser: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enableNotifications"
                      checked={emailSettings.enableNotifications}
                      onChange={(e) =>
                        setEmailSettings({
                          ...emailSettings,
                          enableNotifications: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-primary bg-[#283039] border-[#3b4754] rounded focus:ring-primary"
                    />
                    <label htmlFor="enableNotifications" className="text-sm text-white">
                      Activer les notifications par email
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === "backup" && (
            <>
              <div>
                <h3 className="text-white text-lg font-bold mb-4">Configuration Sauvegarde</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-[#1e293b] border border-[#3b4754] rounded-lg">
                    <input
                      type="checkbox"
                      id="autoBackup"
                      checked={backupSettings.autoBackup}
                      onChange={(e) =>
                        setBackupSettings({
                          ...backupSettings,
                          autoBackup: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-primary bg-[#283039] border-[#3b4754] rounded focus:ring-primary"
                    />
                    <div>
                      <label htmlFor="autoBackup" className="text-sm text-white font-medium">
                        Sauvegarde automatique
                      </label>
                      <p className="text-xs text-[#9dabb9]">
                        Active les sauvegardes automatiques planifiées
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Fréquence de sauvegarde
                    </label>
                    <select
                      value={backupSettings.backupFrequency}
                      onChange={(e) =>
                        setBackupSettings({
                          ...backupSettings,
                          backupFrequency: e.target.value,
                        })
                      }
                      className="w-full bg-[#1e293b] border border-[#3b4754] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="hourly">Toutes les heures</option>
                      <option value="daily">Quotidienne</option>
                      <option value="weekly">Hebdomadaire</option>
                      <option value="monthly">Mensuelle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Rétention des sauvegardes (jours)
                    </label>
                    <Input
                      type="number"
                      value={backupSettings.retentionDays}
                      onChange={(e) =>
                        setBackupSettings({
                          ...backupSettings,
                          retentionDays: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-400 text-[20px]">
                        info
                      </span>
                      <div>
                        <p className="text-sm text-blue-400 font-medium mb-1">
                          Dernière sauvegarde
                        </p>
                        <p className="text-xs text-[#9dabb9]">
                          26 Février 2026 à 03:00 - Succès
                        </p>
                        <button className="mt-2 text-xs text-primary hover:underline">
                          Lancer une sauvegarde manuelle
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#3b4754]">
            <Button
              type="button"
              onClick={onClose}
              className="bg-[#283039] hover:bg-[#3b4754] text-white"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="bg-primary hover:bg-blue-600 text-white"
            >
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
