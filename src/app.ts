import express, { Router, Request, Response, NextFunction } from 'express';
import { Application } from 'express';
import InitialData from './initialData';
import mongoose from 'mongoose';
import errorhandler from 'errorhandler';
import Passport from '../config/passport';
import IController from 'controllers/IController';

// Register Models
import '../models/User';
import '../models/Article';
import '../models/Comment';

class App {
  public app: Application
  public port: number
  public isProduction: boolean
  public router: Router

  constructor(appInit: { port: number; middleWares: any; controllers: any; }) {
    this.app = express()
    this.port = appInit.port
    this.router = Router()
    this.isProduction = Boolean(process.env.isProduction)

    this.middlewares(appInit.middleWares)
    this.config()
    this.routes(appInit.controllers)
    this.assets()
    this.template()
    this.database()
  }

  private middlewares(middleWares: { forEach: (arg0: (middleWare: any) => void) => void; }) {
    middleWares.forEach(middleWare => {
      this.app.use(middleWare)
    })
  }

  private config() {
    const passport = new Passport();
  }

  private routes(controllers: { forEach: (arg0: (controller: IController) => void) => void; }) {
    controllers.forEach(controller => {
      controller.initializeRoutes(this.router)
    });
    this.app.use(this.router)
  }

  private assets() {
    this.app.use(express.static('public'))
    this.app.use(express.static('views'))
    if (!this.isProduction) {
      this.app.use(errorhandler());
    }
  }

  private template() {
    this.app.set('view engine', 'pug')
  }

  private async database() {
    try {
      const db = await mongoose.connect(String(process.env.MONGO_URL), { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });
      const init = new InitialData(db);
      if (!this.isProduction) {
        mongoose.set('debug', true);
      }
    } catch (error) {
      /* Replace with Error handler */
      console.log("MONGODB CONNECTION FAILED.")
      console.log("ERRORS: ", error);
    }
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`App listening on the http://localhost:${this.port}`)
    })
  }
}

export default App;