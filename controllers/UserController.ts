import mongoose, { Error } from 'mongoose';
import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import User, { IUserDoc } from '../models/User';
import Auth, { IAutheticatedRequest, IAutheticatinReturn } from './Auth';
import IController from './IController';


export default class UserController implements IController {
    public router!: Router;

    public initializeRoutes(router: Router) {
        this.router = router;
        this.router.post('/users', this.registerUser);
        this.router.post('/users/login', this.loginUser);
        this.router.get('/user', Auth.Required, this.getUser);
        this.router.put('/user', Auth.Required, this.updateUser);
    }

    private async registerUser(req: Request, res: Response, next: NextFunction) {
        try {
            const user = new User();
            user.username = req.body.user.username;
            user.email = req.body.user.email;
            user.setPassword(req.body.user.password);

            const savedUser = await user.save();
            if (!savedUser) { throw (new Error("Issue creating user")) }
            return res.json({ user: user.toAuthJSON() });
        } catch (error) {
            // return res.status(422).json(error);
            next(error)
        }
    }

    private async loginUser(req: Request, res: Response, next: NextFunction) {
        if (!req.body.user.email) {
            return res.status(422).json({ errors: { email: "can't be blank" } });
        }

        if (!req.body.user.password) {
            return res.status(422).json({ errors: { password: "can't be blank" } });
        }

        try {
            const { err, user, info } = await Auth.PassportAuthentication(req, res);
            if (err) { throw (err) }

            if (user) {
                user.token = user.generateJWT();
                return res.json({ user: user.toAuthJSON() })
            } else {
                return res.status(422).json(info);
            }
        } catch (error) {
            return next(error);
        }
    }

    private async getUser(req: Request, res: Response, next: NextFunction) {
        try {
            const request = req as IAutheticatedRequest;
            const user = await User.findById(request.payload.id);
            if (!user) { return res.sendStatus(401); }

            return res.json({ user: user.toAuthJSON() });

        } catch (error) {
            next(error);
        }
    }

    private async updateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const request = req as IAutheticatedRequest;
            const user = await User.findById(request.payload.id);
            if (!user) { return res.sendStatus(401); }

            // only update fields that were actually passed...
            if (typeof req.body.user.username !== 'undefined') {
                user.username = req.body.user.username;
            }
            if (typeof req.body.user.email !== 'undefined') {
                user.email = req.body.user.email;
            }
            if (typeof req.body.user.bio !== 'undefined') {
                user.bio = req.body.user.bio;
            }
            if (typeof req.body.user.image !== 'undefined') {
                user.image = req.body.user.image;
            }
            if (typeof req.body.user.password !== 'undefined') {
                user.setPassword(req.body.user.password);
            }

            const savedUser = await user.save();
            if (!savedUser) { throw (new Error("Issue updating user")) }

            return res.json({ user: user.toAuthJSON() });
        } catch (error) {
            next(error);
        }
    }
}