import mongoose, { Document, Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import secret from '../config';
import { IArticleDoc } from './Article';

export interface IUserDoc extends Document {
    username: string;
    email: string;
    bio: string;
    image: string;
    hash: string;
    salt: string;
    token: string;
    favorites: IArticleDoc[];
    following: IUserDoc[];
    setPassword(password: string): void;
    validPassword(password: string): boolean;
    generateJWT(): string;
    toAuthJSON(): JSON;
    toProfileJSONFor(user: IUserDoc | null): JSON;
    isFavorite(id: Schema.Types.ObjectId): boolean;
    favorite(id: Schema.Types.ObjectId): IUserDoc;
    unfavorite(id: Schema.Types.ObjectId): IUserDoc;
    follow(id: Schema.Types.ObjectId): IUserDoc;
    unfollow(id: Schema.Types.ObjectId): IUserDoc;
    isFollowing(id: Schema.Types.ObjectId): boolean;
}

const UserSchema = new mongoose.Schema({
    username: {
        type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true
    },
    email: {
        type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true
    },
    bio: String,
    image: String,
    hash: String,
    salt: String,
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

UserSchema.plugin(uniqueValidator, { message: 'is already taken.' });

UserSchema.methods.setPassword = function (password: string) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
}

UserSchema.methods.validPassword = function (password: string) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
}

UserSchema.methods.generateJWT = function () {
    const today = new Date();
    const exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    return jwt.sign({
        id: this._id,
        username: this.username,
        exp: (exp.getTime() / 1000),
    }, secret);
}

UserSchema.methods.toAuthJSON = function () {
    return {
        username: this.username,
        email: this.email,
        token: this.generateJWT(),
        bio: this.bio || null,
        image: this.image || null
    };
};

UserSchema.methods.toProfileJSONFor = function (user: IUserDoc | null) {
    return {
        username: this.username,
        bio: this.bio,
        image: this.image || 'https://static.productionready.io/images/smiley-cyrus.jpg',
        following: user ? user.isFollowing(this._id) : false
    }
}

UserSchema.methods.favorite = async function (id: Schema.Types.ObjectId) {
    if (this.favorites.indexOf(id) === -1) {
        this.favorites.push(id);
    }
    return await this.save();
}

UserSchema.methods.unfavorite = async function (id: Schema.Types.ObjectId) {
    this.favorites.remove(id);
    return await this.save();
};

UserSchema.methods.isFavorite = function (id: Schema.Types.ObjectId) {
    return this.favorites.some((favoriteId: Schema.Types.ObjectId) => {
        return favoriteId.toString() === id.toString();
    });
};

UserSchema.methods.follow = async function (id: Schema.Types.ObjectId) {
    if (this.following.indexOf(id) === -1) {
        this.following.push(id);
    }

    return await this.save();
};

UserSchema.methods.unfollow = async function (id: Schema.Types.ObjectId) {
    this.following.remove(id);
    return await this.save();
};

UserSchema.methods.isFollowing = function (id: Schema.Types.ObjectId) {
    return this.following.some((followId: Schema.Types.ObjectId) => {
        return followId.toString() === id.toString();
    });
};

export default mongoose.model<IUserDoc>('User', UserSchema);