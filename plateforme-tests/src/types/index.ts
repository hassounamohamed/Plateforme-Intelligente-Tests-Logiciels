// ─── Roles ───────────────────────────────────────────────────────────────────

export type Role =
  | "DEVELOPPEUR"
  | "PRODUCT_OWNER"
  | "TESTEUR_QA"
  | "SCRUM_MASTER"
  | "SUPER_ADMIN";

// ─── User ────────────────────────────────────────────────────────────────────

export interface Permission {
  id: number;
  nom: string;
  resource: string;
  action: string;
}

export interface RoleDetails {
  id: number;
  nom: string;
  code: string;
  description?: string;
  niveau_acces: number;
  permissions?: Permission[];
}

export interface User {
  id: number;
  nom: string;
  email: string;
  telephone?: string;
  role_id?: number;
  actif: boolean;
  dateCreation?: string;
  derniereConnexion?: string;
  role?: RoleDetails;
}

// ─── Auth payloads ───────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string; // Optional car le backend n'utilise pas de refresh token
}

export interface LoginPayload {
  username: string; // Backend utilise OAuth2PasswordRequestForm qui attend 'username'
  password: string;
}

export interface RegisterPayload {
  nom: string;
  email: string;
  motDePasse: string;
  telephone?: string;
  role_id?: number;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

// ─── Auth responses ──────────────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  nom: string;
  email: string;
  role?: RoleDetails;
}

export interface RegisterResponse {
  message: string;
  user_id: number;
  role_id?: number;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

// ─── Generic API response ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export interface MemberSimple {
  id: number;
  nom: string;
  email: string;
}

export interface Project {
  id: number;
  nom: string;
  description?: string;
  dateDebut?: string;
  dateFin?: string;
  objectif?: string;
  statut: string;
  productOwnerId: number;
  membres?: MemberSimple[];
}

export interface CreateProjectPayload {
  nom: string;
  description?: string;
  dateDebut?: string;
  dateFin?: string;
  objectif?: string;
}

export interface UpdateProjectPayload {
  nom?: string;
  description?: string;
  dateDebut?: string;
  dateFin?: string;
  objectif?: string;
  statut?: string;
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export interface EpicSummary {
  id: number;
  titre: string;
  statut?: string;
  priorite?: number;
}

export interface Module {
  id: number;
  nom: string;
  description?: string;
  ordre: number;
  projet_id: number;
  epics?: EpicSummary[];
}

export interface CreateModulePayload {
  nom: string;
  description?: string;
  ordre?: number;
}

export interface UpdateModulePayload {
  nom?: string;
  description?: string;
  ordre?: number;
}

// ─── Epics ───────────────────────────────────────────────────────────────────

export type EpicStatus = "to_do" | "in_progress" | "done";

export interface UserStorySummary {
  id: number;
  titre: string;
  statut?: string;
  points?: number;
  priorite?: string;
}

export interface Epic {
  id: number;
  titre: string;
  description?: string;
  priorite: number;
  businessValue?: string;
  statut: EpicStatus;
  module_id: number;
  user_stories?: UserStorySummary[];
}

export interface CreateEpicPayload {
  titre: string;
  description?: string;
  priorite?: number;
  businessValue?: string;
  statut?: EpicStatus;
}

export interface UpdateEpicPayload {
  titre?: string;
  description?: string;
  priorite?: number;
  businessValue?: string;
}

export interface ChangeStatusPayload {
  statut: EpicStatus;
}

export interface ChangePriorityPayload {
  priorite: number;
}

// ─── Sprints ─────────────────────────────────────────────────────────────────

export interface Sprint {
  id: number;
  nom: string;
  dateDebut?: string;
  dateFin?: string;
  objectifSprint?: string;
  capaciteEquipe?: number;
  velocite: number;
  statut: SprintStatus;
  projet_id: number;
  scrumMasterId?: number;
  userstories?: UserStorySummary[];
  rapport_qa?: RapportQA;
}

export type SprintStatus = "planifie" | "en_cours" | "termine";

export interface CreateSprintPayload {
  nom: string;
  dateDebut?: string;
  dateFin?: string;
  objectifSprint?: string;
  capaciteEquipe?: number;
}

// ─── Tests & Validation ──────────────────────────────────────────────────────

export interface Test {
  id: number;
  nom: string;
  description?: string;
  type: TestType;
  statut: TestStatus;
  cahier_id?: number;
  userStoryId?: number;
  dateCreation?: string;
  derniere_execution?: ExecutionTest;
}

export type TestType = "unitaire" | "automatise" | "integration" | "e2e";
export type TestStatus = "non_execute" | "en_cours" | "reussi" | "echoue";

export interface ExecutionTest {
  id: number;
  dateExecution: string;
  statut: TestStatus;
  duree?: number;
  resultat?: string;
  erreurs?: string;
  testId: number;
}

export interface ValidationTest {
  id: number;
  dateValidation: string;
  statut: "valide" | "rejete" | "en_attente";
  commentaire?: string;
  testId: number;
  validateur_id?: number;
  validateur_nom?: string;
}

export interface CahierTests {
  id: number;
  dateGeneration: string;
  statut: string;
  nombreTests: number;
  userstory_id: number;
  userstory_titre?: string;
  tests?: Test[];
}

// ─── Rapports QA ─────────────────────────────────────────────────────────────

export interface RapportQA {
  id: number;
  dateGeneration: string;
  statut: string;
  tauxReussite: number;
  nombreTestsExecutes: number;
  nombreTestsReussis: number;
  nombreTestsEchoues: number;
  recommandations?: string;
  sprintId?: number;
  sprint?: {
    nom: string;
    dateDebut?: string;
    dateFin?: string;
  };
  indicateurs?: IndicateurQualite;
  recommandations_qualite?: RecommandationQualite[];
}

export interface IndicateurQualite {
  id: number;
  tauxCouverture: number;
  tauxReussite: number;
  nombreAnomalies: number;
  nombreAnomaliesCritiques: number;
  indiceQualite: number;
  tendance: "croissante" | "stable" | "decroissante";
  rapportId: number;
}

export interface RecommandationQualite {
  id: number;
  titre: string;
  description?: string;
  categorie: string;
  priorite: "haute" | "moyenne" | "basse";
  impact: number;
  statut: "en_attente" | "en_cours" | "appliquee" | "rejetee";
  rapportId: number;
}
