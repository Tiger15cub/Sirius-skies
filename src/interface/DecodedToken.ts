import { JwtPayload } from "jsonwebtoken";

export interface DecodedToken extends JwtPayload {
  jti: string;
  clid: string;
  am: string;
  dvid: string;
}
