export type View = "home" | "apply" | "admin" | "login" | "register" | "otp" | "track";
export type AuthUser = { id?: number; name: string; email: string; role: "user" | "admin"; phone?: string | null };

export type AgeGroup = "remaja" | "dewasa" | "pralansia" | "lansia";
export type ColorBlindness = "ya" | "tidak";
export type SvcModel = "mandiri" | "bantuan" | "bantuan_penuh";
export type InternetCond = "stabil" | "tidak_stabil";

export interface UserProfile {
  age: AgeGroup;
  colorBlind: ColorBlindness;
  serviceModel: SvcModel;
  internet: InternetCond;
}

export type ServiceType = "sip" | "oss" | "simbg";
