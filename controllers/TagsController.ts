import mongoose, { Error } from 'mongoose';
import { Router, Request, Response, NextFunction } from 'express';
import User, { IUserDoc } from '../models/User';
import Auth, { IAutheticatedRequest, IAutheticatinReturn } from './Auth';
import IController from './IController';
import Article from '../models/Article';


export default class TagsController implements IController {
    public router!: Router;

    public initializeRoutes(router: Router) {
        this.router = router;
        this.router.get('/tags/', this.GetTags);
    }

    private async GetTags(req: Request, res: Response, next: NextFunction) {
        try {
            const tags = await Article.find().distinct('tagList');
            return res.json({ tags });
        } catch (error) {
            next(error);
        }
    }
}