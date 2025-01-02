import { Request, Response, NextFunction } from 'express';
import { Middleware } from './middleware.interface.js';
import { StatusCodes } from 'http-status-codes';
import { jwtVerify } from 'jose';
import { HttpError } from '../rest-exceptions/http-error.js';

export enum AuthorizeMiddlewareMode {
  RaiseError = 'RaiseError',
  Silent = 'Silent',
}

export class AuthorizeMiddleware implements Middleware {
  constructor(
    private readonly jwtSecret: string,
    private readonly mode: AuthorizeMiddlewareMode = AuthorizeMiddlewareMode.RaiseError,
  ) {}

  public async handleAsync(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      if (this.mode === AuthorizeMiddlewareMode.Silent) {
        next();
        return;
      }

      throw new HttpError(StatusCodes.UNAUTHORIZED, 'Not found access token');
    }

    try {
      const encodedSecret = new TextEncoder().encode(this.jwtSecret);
      const token = authorizationHeader?.split(' ')[1];
      const result = await jwtVerify(token, encodedSecret);
      const { userId } = result.payload;
      res.locals.userId = userId;
    } catch (err: unknown) {
      if (this.mode === AuthorizeMiddlewareMode.RaiseError) {
        throw new HttpError(StatusCodes.UNAUTHORIZED, 'Bad access token', String(err));
      }
    }

    next();
  }
}
