import User from '../models/User';
import Article from '../models/Article';
import Comment from '../models/Comment';
import mongoose, { Error } from 'mongoose';
class InitialData {

    constructor(db: typeof mongoose) {
        this.initialData(db);
    }

    private async initialData(db: typeof mongoose) {
        /* Uncomment for Testing
        try {
            await db.connection.db.dropCollection('users');
            await db.connection.db.dropCollection('article');
            await db.connection.db.dropCollection('comment');
        } catch (error) {
            throw new Error(("User: " + error));
        }
*/
    }
}

export default InitialData;