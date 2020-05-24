import { Router, Request, Response, ErrorRequestHandler, NextFunction } from "express";
import IController from "./IController";

interface IErrorHandler {
    errors: {
        [index: string]: {
            name: string,
            message: string
        }
    },
    name: string
}

interface IError {
    [index: string]: string
}


export default class ErrorHandlerControlle implements IController {
    public router!: Router;

    public initializeRoutes(router: Router) {
        this.router = router;
        this.router.use(this.errorHandler)
    }

    private errorHandler(err: IErrorHandler, req: Request, res: Response, next: NextFunction) {
        if (err.name === 'ValidationError') {
            return res.status(422).json({
                errors: Object.keys(err.errors).reduce((errors: IError, key) => {
                    errors[key] = err.errors[key].message

                    return errors;
                }, {})
            });
        }

        return next(err);
    }
}