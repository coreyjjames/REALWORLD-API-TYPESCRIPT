import express from './node_modules/express';
import path from 'path';
import cookieParser from './node_modules/cookie-parser';
import logger from './node_modules/morgan';
import indexRouter from './routes/index';
import usersRouter from './routes/users';

var app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);

export default app;