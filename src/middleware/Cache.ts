import { Request, Response, NextFunction } from "express";
import AsyncCache from "../utils/caching/AsyncCache";

const cache = new AsyncCache<any>();

export default function Cache(req: Request, res: Response, next: NextFunction) {
  const key = req.originalUrl || req.url;
  cache
    .get(key)
    .then((cachedResponse) => {
      if (cachedResponse) {
        res.status(cachedResponse.status);
        res.send(cachedResponse.body);
      } else {
        const originalSend = res.send;
        const originalJson = res.json;

        res.send = function <T>(this: Response, body: T): Response {
          const cachedData = { body, status: res.statusCode };
          cache.set(key, cachedData);
          return originalSend.call(this, body);
        };

        res.json = function <T>(this: Response, body: T): Response {
          const cachedData = { body, status: res.statusCode };
          cache.set(key, cachedData);
          return originalJson.call(this, body);
        };

        next();
      }
    })
    .catch((err) => {
      console.error("Cache error:", err);
      next();
    });
}
