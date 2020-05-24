import mongoose, { Error } from 'mongoose';
import { Router, Request, Response, NextFunction } from 'express';
import User, { IUserDoc } from '../models/User';
import Comment, { ICommentDoc } from '../models/Comment';
import Article, { IArticleDoc } from '../models/Article';
import Auth, { IAutheticatedRequest, IAutheticatinReturn } from './Auth';
import IController from './IController';

interface IRequestWithArticle extends IAutheticatedRequest, Request {
    article: IArticleDoc;
    comment: ICommentDoc;
}

interface IQuery {
    tagList?: object;
    author?: IUserDoc;
    _id?: object;
}

export default class ArticleController implements IController {
    public router!: Router;

    public initializeRoutes(router: Router) {
        this.router = router;
        this.router.param('article', this.PrePopulateArticleData);
        this.router.param('comment', this.PrePopulateCommentData);

        this.router.get('/articles', Auth.Optional, this.GetArticle);
        this.router.get('/articles/feed', Auth.Required, this.GetFeed);
        this.router.post('/articles', Auth.Required, this.CreateArticle);
        this.router.get('/articles/:article', Auth.Required, this.GetArticleBySlug);
        this.router.put('/articles/:article', Auth.Required, this.UpdatingArticle);
        this.router.delete('/articles/:article', Auth.Required, this.DeleteArticle);

        this.router.post('/articles/:article/favorite', Auth.Required, this.FavoriteArticle);
        this.router.delete('/articles/:article/favorite', Auth.Required, this.UnfavoriteArticle);

        this.router.post('/articles/:article/comments', Auth.Required, this.CreateComment);
        this.router.get('/articles/:article/comments', Auth.Optional, this.GetComments);
        this.router.delete('/articles/:article/comments/:comment', Auth.Required, this.DeleteComments);

    }

    private async PrePopulateArticleData(req: Request, res: Response, next: NextFunction, slug: string) {
        try {
            const request = req as IRequestWithArticle;
            let article = await Article.findOne({ slug });
            if (!article) { return res.sendStatus(404); }

            article = await article.execPopulate();

            request.article = article;

            return next();
        } catch (error) {
            next(error);
        }
    }

    private async PrePopulateCommentData(req: Request, res: Response, next: NextFunction, id: string) {
        try {
            const request = req as IRequestWithArticle;
            const comment = await Comment.findById(id);
            if (!comment) { return res.sendStatus(404); }

            request.comment = comment;

            return next();
        } catch (error) {
            next(error);
        }
    }

    private async GetArticle(req: Request, res: Response, next: NextFunction) {
        const request = req as IAutheticatedRequest;
        try {
            const query: IQuery = {
            };

            let limit = 20;
            let offset = 0;

            if (typeof req.query.limit !== 'undefined') {
                limit = Number(req.query.limit);
            }

            if (typeof req.query.offset !== 'undefined') {
                offset = Number(req.query.offset);
            }

            if (typeof req.query.tag !== 'undefined') {
                query.tagList = { $in: [req.query.tag as string] };
            }

            const author = req.query.author ? await User.findOne({ username: String(req.query.author) }) : null;
            const favoriter = req.query.favorited ? await User.findOne({ username: String(req.query.favorited) }) : null;

            if (author) {
                query.author = author;
            }

            if (favoriter) {
                query._id = { $in: favoriter.favorites };
            } else if (req.query.favorited) {
                query._id = { $in: [] };
            }

            const articles = await Article.find(query)
                .limit(Number(limit))
                .skip(Number(offset))
                .sort({ createdAt: 'desc' })
                .populate('author')
                .exec();

            const articlesCount = await Article.count(query).exec();

            const userData = request.payload ? await User.findById(request.payload.id) : null;

            return res.json({
                articles: articles.map((article) => {
                    return article.toJSONFor(userData);
                }),
                articlesCount
            });
        } catch (error) {
            next(error);
        }
    }
    private async GetFeed(req: Request, res: Response, next: NextFunction) {
        const request = req as IAutheticatedRequest;
        try {
            let limit = 20;
            let offset = 0;

            if (typeof req.query.limit !== 'undefined') {
                limit = Number(req.query.limit);
            }

            if (typeof req.query.offset !== 'undefined') {
                offset = Number(req.query.offset);
            }

            const userData = await User.findById(request.payload.id);
            if (!userData) { return res.sendStatus(401); }

            const articles = await Article.find({ author: {$in: userData.following}})
                .limit(Number(limit))
                .skip(Number(offset))
                .sort({ createdAt: 'desc' })
                .populate('author')
                .exec();

            const articlesCount = await Article.count({ author: {$in: userData.following}}).exec();

            return res.json({
                articles: articles.map((article) => {
                    return article.toJSONFor(userData);
                }),
                articlesCount
            });
        } catch (error) {
            next(error);
        }
    }

    private async CreateArticle(req: Request, res: Response, next: NextFunction) {
        const request = req as IAutheticatedRequest;
        try {
            const userData = await User.findById(request.payload.id);
            if (!userData) { return res.sendStatus(401); }

            const article = new Article(request.body.article);

            article.author = userData;

            const savedArticle = await article.save();
            if (!savedArticle) { throw ({ errors: { CreateArticle: { message: "Could not save data" } }, name: 'ValidationError' }); }
            return res.json({ article: article.toJSONFor(userData) });
        } catch (error) {
            next(error);
        }
    }

    private async GetArticleBySlug(req: Request, res: Response, next: NextFunction) {
        const request = req as IRequestWithArticle;
        try {
            const userData = request.payload ? await User.findById(request.payload.id) : null;
            if (!userData) { return res.sendStatus(401); }

            await request.article.populate('author').execPopulate();

            return res.json({ article: request.article.toJSONFor(userData) });
        } catch (error) {
            next(error);
        }
    }

    private async UpdatingArticle(req: Request, res: Response, next: NextFunction) {
        const request = req as IRequestWithArticle;
        try {
            const userData = await User.findById(request.payload.id);
            if (!userData) { return res.sendStatus(401); }
            if (request.article.author._id.toString() === request.payload.id.toString()) {
                if (typeof request.body.article.title !== 'undefined') {
                    request.article.title = request.body.article.title;
                }

                if (typeof request.body.article.description !== 'undefined') {
                    request.article.description = request.body.article.description;
                }

                if (typeof request.body.article.body !== 'undefined') {
                    request.article.body = request.body.article.body;
                }

                const savedArticle = await request.article.save();
                if (!savedArticle) { throw ({ errors: { UpdatingArticle: { message: "Could not save data" } }, name: 'ValidationError' }); }

                await savedArticle.populate('author').execPopulate();

                return res.json({ article: savedArticle.toJSONFor(userData) });
            } else {
                return res.sendStatus(403);
            }
        } catch (error) {
            next(error);
        }
    }

    private async DeleteArticle(req: Request, res: Response, next: NextFunction) {
        const request = req as IRequestWithArticle;
        try {
            const userData = await User.findById(request.payload.id);
            if (!userData) { return res.sendStatus(401); }

            if (request.article.author._id.toString() === request.payload.id.toString()) {
                await request.article.remove();

                return res.sendStatus(204);
            } else {
                return res.sendStatus(403);
            }
        } catch (error) {
            next(error);
        }
    }

    private async FavoriteArticle(req: Request, res: Response, next: NextFunction) {
        const request = req as IRequestWithArticle;
        try {
            const articleId = request.article._id;

            const userData = await User.findById(request.payload.id);
            if (!userData) { return res.sendStatus(401); }

            await userData.favorite(articleId);
            const updatedArticle = await request.article.updateFavoriteCount();

            await updatedArticle.populate('author').execPopulate();

            return res.json({ article: updatedArticle.toJSONFor(userData) })

        } catch (error) {
            next(error);
        }
    }

    private async UnfavoriteArticle(req: Request, res: Response, next: NextFunction) {
        const request = req as IRequestWithArticle;
        try {
            const articleId = request.article._id;

            const userData = await User.findById(request.payload.id);
            if (!userData) { return res.sendStatus(401); }

            await userData.unfavorite(articleId);
            const updatedArticle = await request.article.updateFavoriteCount();

            await updatedArticle.populate('author').execPopulate();

            return res.json({ article: updatedArticle.toJSONFor(userData) })

        } catch (error) {
            next(error);
        }
    }

    private async CreateComment(req: Request, res: Response, next: NextFunction) {
        const request = req as IRequestWithArticle;
        try {
            const userData = await User.findById(request.payload.id);
            if (!userData) { return res.sendStatus(401); }

            const comment = new Comment(request.body.comment)

            comment.article = request.article;
            comment.author = userData;

            await comment.save();

            request.article.comments.push(comment);
            await request.article.save();

            return res.json({ comment: comment.toJSONFor(userData) })

        } catch (error) {
            next(error);
        }
    }

    private async GetComments(req: Request, res: Response, next: NextFunction) {
        const request = req as IRequestWithArticle;
        try {
            const userData = request.payload.id ? await User.findById(request.payload.id) : null;

            const article = await request.article.populate({
                path: 'comments',
                populate: {
                    path: 'author'
                },
                options: {
                    sort: {
                        createdAt: 'desc'
                    }
                }
            }).execPopulate();

            return res.json({
                comments: article.comments.map((comment) => {
                    return comment.toJSONFor(userData);
                })
            });

        } catch (error) {
            next(error);
        }
    }

    private async DeleteComments(req: Request, res: Response, next: NextFunction) {
        const request = req as IRequestWithArticle;
        try {
            if (request.comment.author.toString() === request.payload.id.toString()) {
                request.article.comments.filter((comment) => {
                    if (comment._id.toString() !== request.comment._id.toString()) {
                        return comment;
                    }
                });

                await request.article.save();

                await Comment.find({ _id: request.comment._id }).remove().exec();

                res.sendStatus(204);
            }
            else {
                res.sendStatus(403);
            }
        } catch (error) {
            next(error);
        }
    }
}