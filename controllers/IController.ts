import { Router } from "express"

export default interface IController {
    router: Router;
    initializeRoutes(router: Router): void;
}