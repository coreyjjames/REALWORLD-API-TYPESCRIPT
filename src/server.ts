import App from './app'

import path from 'path';
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import methodoverride from 'method-override';

import dotenv from 'dotenv';

// Import Routes
import errorHandlerController from '../controllers/ErrorHandlerController'
import userController from '../controllers/UserController'
import ProfileController from '../controllers/ProfileController'
import ArticleController from '../controllers/ArticleController'
import TagsController from '../controllers/TagsController'


dotenv.config()
const app = new App({
    port: Number(process.env.PORT),
    controllers: [
        new userController(),
        new ProfileController(),
        new ArticleController(),
        new TagsController(),
        new errorHandlerController()
    ],
    middleWares: [
        cors(),
        morgan('dev'),
        bodyParser.json(),
        bodyParser.urlencoded({ extended: true }),
        methodoverride(),
    ]
})

app.listen()