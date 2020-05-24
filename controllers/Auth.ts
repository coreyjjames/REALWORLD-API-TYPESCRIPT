import jwt from 'express-jwt';
import secret from '../config';
import { Request, Response, NextFunction } from 'express';
import User, { IUserDoc } from '../models/User';
import passport from 'passport';

export interface IAutheticatedRequest extends Request {
    payload: {
        id: string
    }
}

export interface IAutheticatinReturn {
    err: string,
    user: IUserDoc,
    info: { message: any },
}

class Auth {
    public static Required(req: Request, res: Response, next: NextFunction) {
        return jwt({
            secret,
            userProperty: 'payload',
            getToken: Auth.getTokenFromHeader
        })(req, res, next);
    }

    public static Optional(req: Request, res: Response, next: NextFunction) {
        return jwt({
            secret,
            userProperty: 'payload',
            credentialsRequired: false,
            getToken: Auth.getTokenFromHeader
        })(req, res, next);
    }

    public static getTokenFromHeader(req: Request) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token') {
            return req.headers.authorization.split(' ')[1];
        }

        return null;
    }

    public static PassportAuthentication(req: Request, res: Response): Promise<IAutheticatinReturn> {
        return new Promise((resolve, reject) => {
            passport.authenticate('local', { session: false }, (err, user, info) => {
                resolve({ err, user, info });
            })(req, res);
        });
    }
}

export default Auth;






