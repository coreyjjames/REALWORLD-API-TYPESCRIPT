import mongoose, { Document } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import slug from 'slug';
import User, { IUserDoc } from './User';
import { ICommentDoc } from './Comment';
const Schema = mongoose.Schema;

export interface IArticleDoc extends Document {
    slug: string;
    title: string;
    description: string;
    body: string;
    favoritesCount: number;
    taglist: string[];
    author: IUserDoc;
    comments: ICommentDoc[];
    toJSONFor(user: IUserDoc | null): JSON;
    slugify(): void;
    updateFavoriteCount(): IArticleDoc;
}

const ArticleSchema = new mongoose.Schema({
    slug: { type: String, lowercase: true, unique: true },
    title: String,
    description: String,
    body: String,
    favoritesCount: { type: Number, default: 0 },
    tagList: [{ type: String }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
}, { timestamps: true });

ArticleSchema.plugin(uniqueValidator, { message: 'is already taken' });

ArticleSchema.methods.slugify = function () {
    this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString();
};

ArticleSchema.pre('validate', function (next) {
    const _this = this as IArticleDoc;
    if (!_this.slug) {
        _this.slugify();
    }
    next();
});

ArticleSchema.methods.toJSONFor = function (user: IUserDoc | null) {
    return {
        slug: this.slug,
        title: this.title,
        description: this.description,
        body: this.body,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        tagList: this.tagList,
        favorited: user ? user.isFavorite(this._id) : false,
        favoritesCount: this.favoritesCount,
        author: this.author.toProfileJSONFor(user)
    };
};

ArticleSchema.methods.updateFavoriteCount = async function () {
    const article = this;

    const count = await User.count({ favorites: { $in: [article._id] } });
    article.favoritesCount = count;

    return await article.save();
};

export default mongoose.model<IArticleDoc>('Article', ArticleSchema);