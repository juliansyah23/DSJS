import { AuthUser, ServiceType, UserProfile } from "./types";

const API_URL = String((import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");
const TOKEN_KEY = "dsj_api_token";

type ApiEnvelope<T> = { success: boolean; message?: string; data: T };

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;
  data?: Record<string, unknown>;

  constructor(message: string, status: number, errors: Record<string, string[]> = {}, data?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.data = data;
  }

  firstValidationMessage(): string {
    return Object.values(this.errors).flat()[0] ?? this.message;
  }
}

export type ApiProfile = {
  age_group: UserProfile["age"];
  color_blind: boolean;
  service_model: UserProfile["serviceModel"];
  internet_condition: UserProfile["internet"];
};

export type ApiUser = AuthUser & {
  id: number;
  phone: string | null;
  is_active: boolean;
  profile: ApiProfile | null;
};

export type ApiDraft = {
  id: number;
  service_type: ServiceType | null;
  current_step: number;
  skip_company: boolean;
  form_data: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export type ApiStage = {
  id: number;
  sequence: number;
  name: string;
  status: "pending" | "in_progress" | "completed" | "rejected";
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
};

export type ApiApplication = {
  id: number;
  code: string;
  service_type: ServiceType;
  service_label: string;
  applicant_name?: string;
  company_name?: string | null;
  status: "pending" | "review" | "approved" | "rejected";
  submitted_at: string;
  completed_at: string | null;
  officer?: { id: number; name: string } | null;
  stages: ApiStage[];
  form_data?: Record<string, unknown>;
  files?: Array<{ id: number; label: string; original_name: string; mime_type: string; size: number }>;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "user" | "admin";
  is_active: boolean;
  email_verified: boolean;
  applications_count: number;
  created_at: string;
};

export type DashboardStats = {
  summary: { total: number; approved: number; processing: number; rejected: number; users: number };
  monthly_apps: Array<{ month: string; apps: number; approved: number }>;
  status_distribution: Array<{ name: string; color: string; status: string; value: number }>;
  processing_time: Array<{ service: string; days: number }>;
  bottlenecks: Array<{ stage: string; avg: number; target: number }>;
};

export type Pagination = {
  current_page: number;
  last_page: number;
  per_page?: number;
  total: number;
};

export type AdminNotification = {
  id: number;
  code: string;
  applicant_name: string;
  service_label: string;
  status: ApiApplication["status"];
  submitted_at: string;
};

export type AuditLogEntry = {
  id: number;
  user_id: number | null;
  action: string;
  auditable_type: string | null;
  auditable_id: number | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

/** Query params admin — dibangun aman lewat URLSearchParams. */
export type AdminApplicationQuery = {
  search?: string;
  service_type?: ServiceType | "";
  status?: ApiApplication["status"] | "";
  per_page?: number;
  page?: number;
};

export type AdminUserQuery = {
  search?: string;
  role?: AdminUser["role"] | "";
  status?: "active" | "inactive" | "";
};

function toQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === "all") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function getAuthToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch (error) {
    // Abort bukan kegagalan jaringan — teruskan agar pemanggil bisa mengabaikannya.
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("Server tidak dapat dihubungi. Pastikan API Laravel sedang berjalan.", 0);
  }

  const payload = await response.json().catch(() => ({})) as {
    message?: string;
    errors?: Record<string, string[]>;
    data?: Record<string, unknown>;
  };
  if (!response.ok) {
    if (response.status === 401 && token) setAuthToken(null);
    throw new ApiError(payload.message ?? "Permintaan gagal diproses.", response.status, payload.errors, payload.data);
  }

  return payload as T;
}

const json = (value: unknown): string => JSON.stringify(value);

export function profileFromApi(profile: ApiProfile): UserProfile {
  return {
    age: profile.age_group,
    colorBlind: profile.color_blind ? "ya" : "tidak",
    serviceModel: profile.service_model,
    internet: profile.internet_condition,
  };
}

export function profileToApi(profile: UserProfile): ApiProfile {
  return {
    age_group: profile.age,
    color_blind: profile.colorBlind === "ya",
    service_model: profile.serviceModel,
    internet_condition: profile.internet,
  };
}

export const api = {
  async register(input: { name: string; email: string; phone: string; password: string; password_confirmation: string }) {
    return request<ApiEnvelope<{ email: string; name: string }>>("/auth/register", { method: "POST", body: json(input) });
  },
  async login(email: string, password: string) {
    const response = await request<ApiEnvelope<{ user: ApiUser; token: string }>>("/auth/login", { method: "POST", body: json({ email, password }) });
    setAuthToken(response.data.token);
    return response.data.user;
  },
  async verifyOtp(email: string, code: string) {
    const response = await request<ApiEnvelope<{ user: ApiUser; token: string }>>("/auth/verify-otp", {
      method: "POST",
      body: json({ email, code, purpose: "register" }),
    });
    setAuthToken(response.data.token);
    return response.data.user;
  },
  resendOtp(email: string, purpose: "register" | "reset_password" = "register") {
    return request<ApiEnvelope<Record<string, never>>>("/auth/resend-otp", { method: "POST", body: json({ email, purpose }) });
  },
  forgotPassword(email: string) {
    return request<ApiEnvelope<Record<string, never>>>("/auth/forgot-password", { method: "POST", body: json({ email }) });
  },
  resetPassword(email: string, code: string, password: string, password_confirmation: string) {
    return request<ApiEnvelope<Record<string, never>>>("/auth/reset-password", {
      method: "POST",
      body: json({ email, code, password, password_confirmation }),
    });
  },
  async me() {
    return (await request<ApiEnvelope<{ user: ApiUser }>>("/auth/me")).data.user;
  },
  async logout() {
    try {
      await request<ApiEnvelope<Record<string, never>>>("/auth/logout", { method: "POST" });
    } finally {
      setAuthToken(null);
    }
  },
  async getProfile() {
    return (await request<ApiEnvelope<{ profile: ApiProfile | null }>>("/profile")).data.profile;
  },
  async updateProfile(profile: UserProfile) {
    return (await request<ApiEnvelope<{ profile: ApiProfile }>>("/profile", { method: "PUT", body: json(profileToApi(profile)) })).data.profile;
  },
  async drafts() {
    return (await request<ApiEnvelope<{ drafts: ApiDraft[] }>>("/drafts")).data.drafts;
  },
  async createDraft(input: Omit<ApiDraft, "id" | "created_at" | "updated_at">) {
    return (await request<ApiEnvelope<{ draft: ApiDraft }>>("/drafts", { method: "POST", body: json(input) })).data.draft;
  },
  async updateDraft(id: number, input: Omit<ApiDraft, "id" | "created_at" | "updated_at">) {
    return (await request<ApiEnvelope<{ draft: ApiDraft }>>(`/drafts/${id}`, { method: "PUT", body: json(input) })).data.draft;
  },
  deleteDraft(id: number) {
    return request<ApiEnvelope<Record<string, never>>>(`/drafts/${id}`, { method: "DELETE" });
  },
  async applications() {
    return (await request<ApiEnvelope<{ applications: ApiApplication[] }>>("/applications")).data.applications;
  },
  async application(id: number, signal?: AbortSignal) {
    return (await request<ApiEnvelope<{ application: ApiApplication }>>(`/applications/${id}`, { signal })).data.application;
  },
  async downloadApplicationFile(applicationId: number, file: { id: number; original_name: string }) {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/applications/${applicationId}/files/${file.id}`, {
      headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!response.ok) {
      if (response.status === 401) setAuthToken(null);
      const payload = await response.json().catch(() => ({}));
      throw new ApiError(payload.message ?? "Berkas gagal diunduh.", response.status);
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = file.original_name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  async submitApplication(input: { serviceType: ServiceType; skipCompany: boolean; draftId: number | null; formData: Record<string, string>; files: File[]; labels: string[] }) {
    const body = new FormData();
    body.append("service_type", input.serviceType);
    body.append("skip_company", input.skipCompany ? "1" : "0");
    if (input.draftId) body.append("draft_id", String(input.draftId));
    body.append("form_data", json(input.formData));
    body.append("file_labels", json(input.labels));
    input.files.forEach(file => body.append("files[]", file));
    return (await request<ApiEnvelope<{ application: ApiApplication }>>("/applications", { method: "POST", body })).data.application;
  },
  async track(code: string) {
    return (await request<ApiEnvelope<{ application: ApiApplication }>>(`/track/${encodeURIComponent(code)}`)).data.application;
  },
  async adminStats(period = 30, signal?: AbortSignal) {
    return (await request<ApiEnvelope<DashboardStats>>(`/admin/dashboard/stats${toQuery({ period })}`, { signal })).data;
  },
  async adminNotifications(signal?: AbortSignal) {
    return (await request<ApiEnvelope<{ notifications: AdminNotification[] }>>("/admin/dashboard/notifications", { signal })).data.notifications;
  },
  async adminApplications(query: AdminApplicationQuery = {}, signal?: AbortSignal) {
    return (await request<ApiEnvelope<{ applications: ApiApplication[]; pagination: Pagination }>>(
      `/admin/applications${toQuery(query)}`,
      { signal },
    )).data;
  },
  async updateAdminApplication(
    id: number,
    input: { status?: ApiApplication["status"]; officer_id?: number | null; stage_sequence?: number; stage_status?: ApiStage["status"]; notes?: string | null },
  ) {
    return (await request<ApiEnvelope<{ application: ApiApplication }>>(`/admin/applications/${id}`, {
      method: "PATCH",
      body: json(input),
    })).data.application;
  },
  async adminUsers(query: AdminUserQuery = {}, signal?: AbortSignal) {
    return (await request<ApiEnvelope<{ users: AdminUser[] }>>(`/admin/users${toQuery(query)}`, { signal })).data.users;
  },
  async createAdminUser(input: {
    name: string; email: string; phone?: string | null; password: string;
    password_confirmation: string; role: AdminUser["role"]; is_active?: boolean; email_verified?: boolean;
  }) {
    return (await request<ApiEnvelope<{ user: AdminUser }>>("/admin/users", { method: "POST", body: json(input) })).data.user;
  },
  async updateAdminUser(
    id: number,
    input: { name?: string; phone?: string | null; role?: AdminUser["role"]; is_active?: boolean; password?: string; password_confirmation?: string },
  ) {
    return (await request<ApiEnvelope<{ user: AdminUser }>>(`/admin/users/${id}`, { method: "PATCH", body: json(input) })).data.user;
  },
  async adminAuditLogs(perPage = 25, page = 1, signal?: AbortSignal) {
    return (await request<ApiEnvelope<{ audit_logs: AuditLogEntry[]; pagination: Pagination }>>(
      `/admin/audit-logs${toQuery({ per_page: perPage, page })}`,
      { signal },
    )).data;
  },
  async updateAdminAccount(input: { name?: string; phone?: string | null; current_password?: string; password?: string; password_confirmation?: string }) {
    return (await request<ApiEnvelope<{ user: { id: number; name: string; email: string; phone: string | null }; requires_login: boolean }>>("/admin/account", { method: "PATCH", body: json(input) })).data;
  },
};