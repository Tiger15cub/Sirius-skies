import { JwtPayload } from "jsonwebtoken";

export interface VerificationResponse {
  token: string;
  session_id: string | JwtPayload;
  token_type: string;
  client_id: string | null;
  internal_client: boolean;
  client_service: string;
  account_id: string;
  expires_in: number;
  expires_at: string;
  auth_method: string | null;
  display_name: string | null;
  app: string;
  in_app_id: string;
  device_id: string | null;
}
