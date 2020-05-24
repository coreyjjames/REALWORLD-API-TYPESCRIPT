import mongoose, { Document } from 'mongoose';
import User, { IUserDoc } from './User';
import { IArticleDoc } from './Article';



export interface ICommentDoc extends Document {
    body: string;
    author: IUserDoc;
    article: IArticleDoc;
    toJSONFor(user: IUserDoc | null): JSON;
}

const CommentSchema = new mongoose.Schema({
    body: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' }
}, { timestamps: true });

// Requires population of author
CommentSchema.methods.toJSONFor = function (user: IUserDoc | null) {
    return {
        id: this._id,
        body: this.body,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        author: this.author.toProfileJSONFor(user)
    };
};

export default mongoose.model<ICommentDoc>('Comment', CommentSchema);