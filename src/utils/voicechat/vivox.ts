import jwt, { SignOptions, Algorithm } from "jsonwebtoken";
import { VivoxTokenClaims } from "../../interface";
import { DateTime } from "luxon";

export default class VivoxTokenGenerator {
  private readonly secretKey: string;
  private readonly algorithm: Algorithm;
  private readonly defaultOptions: SignOptions;
  private readonly defaultExpiration: string;

  constructor(backendSecret: string, algorithm: Algorithm = "HS256") {
    this.secretKey = backendSecret;
    this.algorithm = algorithm;
    this.defaultExpiration = "1h";

    this.defaultOptions = {
      algorithm: algorithm,
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
    vxa: string = "login",
    options?: SignOptions
  ): Promise<string> {
    const currentTimeInSeconds = Math.floor(DateTime.local().toSeconds());

    const claims: VivoxTokenClaims = {
      iss: applicationId,
      sub: userId,
      vxa: vxa,
      vxi: this.generateRandomVXI(6),
      t: channelUrl,
      f: userUrl,
    };

    const tokenOptions: SignOptions = {
      ...this.defaultOptions,
      ...options,
      notBefore: currentTimeInSeconds,
      jwtid: `${userId}-${currentTimeInSeconds}`,
    };

    return new Promise<string>((resolve, reject) => {
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
