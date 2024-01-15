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

  private generateRandomVXI(length: number): number {
    let result: number = 0;
    for (let i = 0; i < length; i++) {
      result = result * 10 + Math.floor(Math.random() * 10);
    }
    return result;
  }

  async generateToken(
    applicationId: string,
    userId: string,
    channelUrl: string,
    userUrl: string,
    vxa?: string,
    options?: SignOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const currentTime = Math.floor(DateTime.local().toMillis() / 1000);

      const claims: VivoxTokenClaims = {
        iss: applicationId,
        sub: userId,
        vxa: vxa ?? "login",
        vxi: this.generateRandomVXI(6),
        t: channelUrl,
        f: userUrl,
      };

      const tokenOptions: SignOptions = {
        ...this.defaultOptions,
        ...options,
        expiresIn: this.defaultExpiration,
        notBefore: currentTime,
        jwtid: `${userId}-${currentTime}`,
      };

      jwt.sign(claims, this.secretKey, tokenOptions, (error, token) => {
        if (error) {
          reject(error);
        } else {
          resolve(token as string);
          // return token;
        }
      });
    });
  }
}
