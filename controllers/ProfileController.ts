import mongoose, { Error } from 'mongoose';
import { Router, Request, Response, NextFunction } from 'express';
import User, { IUserDoc } from '../models/User';
import Auth, { IAutheticatedRequest, IAutheticatinReturn } from './Auth';
import IController from './IController';

interface IRequestWithProfile extends IAutheticatedRequest, Request {
    profile: IUserDoc
}

export default class ProfileController implements IController {
    public router!: Router;

    public initializeRoutes(router: Router) {
        this.router = router;
        this.router.param('username', this.PrePopulateUserData);
        this.router.get('/profiles/:username', Auth.Optional, this.GetProfile);
        this.router.post('/profiles/:username/follow', Auth.Required, this.FollowProfile);
        this.router.delete('/profiles/:username/follow', Auth.Required, this.UnfollowProfile);
    }

    private async PrePopulateUserData(req: Request, res: Response, next: NextFunction, username: string) {
        try {
            const request = req as IRequestWithProfile;
            const userData = await User.findOne({ username });
            if (!userData) { return res.sendStatus(404); }

            request.profile = userData;

            return next();
        } catch (error) {
            return next(error);
        }
    }

    private async GetProfile(req: Request, res: Response, next: NextFunction) {
        const request = req as IRequestWithProfile;
        try {
            if (request.payload) {
                const userData = await User.findById(request.payload.id);
                if (!userData) { return res.sendStatus(401); }

                return res.json({ profile: request.profile.toProfileJSONFor(userData) });
            } else {
                return request.profile.toProfileJSONFor(null);
            }

        } catch (error) {
            return request.profile.toProfileJSONFor(null);
        }
    }

    private async FollowProfile(req: Request, res: Response, next: NextFunction) {
        const request = req as IRequestWithProfile;
        try {
            const userData = await User.findById(request.payload.id);
            if (!userData) { return res.sendStatus(401); }
            const updatedUser = await userData.follow(request.profile._id);

            return res.json({ profile: request.profile.toProfileJSONFor(updatedUser) });

        } catch (error) {
            next(error)
        }
    }

    private async UnfollowProfile(req: Request, res: Response, next: NextFunction) {
        const request = req as IRequestWithProfile;
        try {
            const userData = await User.findById(request.payload.id);
            if (!userData) { return res.sendStatus(401); }

            const updatedUser = await userData.unfollow(request.profile._id);

            return res.json({ profile: request.profile.toProfileJSONFor(updatedUser) });

        } catch (error) {
            next(error)
        }
    }
}