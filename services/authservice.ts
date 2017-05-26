import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import config from '../config';
import { User } from '../models/user';

export interface JWTClaimSet {

    name: string;
    email: string;
}

export interface JWTClaimSetHolder {
    jwtClaimSet?: JWTClaimSet
}

export const authService = {

    jwtMiddleware: (req: Request & JWTClaimSetHolder, res: Response, next: NextFunction) => {
        console.log("Executed");
        console.log(req.cookies);
        const token = req.cookies[config.authentication.cookiename] || '';
        jwt.verify(token, config.authentication.secret, (err: Error, claimSet: any) => {
            req.jwtClaimSet = claimSet;
            next();
        });
    },

    authMiddleware: (req: Request & JWTClaimSetHolder, res: Response, next: NextFunction) => {
        if (!req.jwtClaimSet) {
            res.render('users/sign_in', { errors: ['You need to sign in or sign up before continuing'] });
        } else {
            next();
        }
    },

    isAuthenticated: (req: Request & JWTClaimSetHolder) => {
        console.log(req.jwtClaimSet);
        return !!req.jwtClaimSet;
    },
    getUsername: (req: Request & JWTClaimSetHolder) => {
return new Promise<string>((resolve, reject) => {
    const token = req.cookies[config.authentication.cookiename] || '';
    console.log("Hello");
    console.log(token);
    jwt.verify(token, config.authentication.secret, (err: Error, claimSet: JWTClaimSet) => {
        console.log(claimSet);
        req.jwtClaimSet = claimSet;
       resolve(claimSet.name);
    });
});
    },


    checkPassword: (password: string, user: User): Promise<boolean> => {
        return new Promise<boolean>((resolve, reject) => {
            bcrypt.compare(password, user.password, (err: Error, isValid: boolean) => {
                if (err) {
                    reject('Invalid hash!');
                } else {
                    resolve(isValid);
                }
            });
        });
    },

    setHashedPassword: (user: User, password: string): Promise<User> => {
        return new Promise<User>((resolve, reject) => {
            bcrypt.hash(password + '', 8, (err: Error, hash: string) => {
                if (err) {
                    reject('Could not hash password!');
                } else {
                    user.password = hash;
                    resolve(user);
                }
            });
        });
    },

    setTokenForUser: (res: Response, user: User) => {
        return new Promise((resolve, reject) => {
            const jwtClaimSet: JWTClaimSet = { name: user.username, email: user.email };
            jwt.sign(jwtClaimSet, config.authentication.secret, { algorithm: 'HS256' },
                (err: Error, token: string) => {
                    if (err) {
                        reject('Could not create jwtToken!')
                        console.log(err);
                    } else {
                        console.log("Hello world");
                        res.cookie(config.authentication.cookiename, token);
                        console.log(token);
                        resolve();
                    }
                });
        });
    },

    removeToken: (res: Response) => {
        res.clearCookie(config.authentication.cookiename);
    }
};