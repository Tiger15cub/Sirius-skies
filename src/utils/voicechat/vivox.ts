import jwt, { SignOptions, Algorithm } from "jsonwebtoken";
import { VivoxTokenClaims } from "../../interface";
import { DateTime } from "luxon";

export default class VivoxTokenGenerator {
  private readonly secretKey: string;
  private readonly algorithm: string;
  private readonly defaultOptions: SignOptions;
  private readonly defaultExpiration: string;

  constructor(backendSecret: string, algorithm: Algorithm = "HS256") {
    this.secretKey = backendSecret;
    this.algorithm = algorithm;
    this.defaultExpiration = "1h";

    this.defaultOptions = {
      algorithm: "HS256",
      expiresIn: this.defaultExpiration,
    };
  }

  async generateToken(
    applicationId: string,
    userId: string,
    channelUrl: string,
    userUrl: string,
    options?: SignOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const currentTime = Math.floor(DateTime.local().toMillis() / 1000);

      const claims: VivoxTokenClaims = {
        iss: applicationId,
        sub: userId,
        exp: Math.floor(DateTime.local().plus({ hours: 2 }).toSeconds()),
        vxa: "join",
        t: channelUrl,
        f: userUrl,
      };

      const tokenOptions: SignOptions = {
        ...this.defaultOptions,
        ...options,
        expiresIn: options?.expiresIn || this.defaultExpiration,
        notBefore: currentTime,
        jwtid: `${userId}-${currentTime}`,
      };

      jwt.sign(claims, this.secretKey, tokenOptions, (error, token) => {
        if (error) {
          reject(error);
        } else {
          resolve(token as string);
        }
      });
    });
  }
}
