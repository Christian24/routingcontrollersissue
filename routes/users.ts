import {Router, Request, Response, NextFunction} from 'express';
import {getEntityManager, Repository} from "typeorm";
import {User} from "../models/user";
import {authService} from "../services/authservice";

import {getConnectionManager} from "typeorm";
import {JsonController} from "routing-controllers/decorator/JsonController";
import {Authorized, Body, CurrentUser, Get, Param, Post, Res} from "routing-controllers";


interface authData {
    password: string;
    username: string;
    email?: string;
}
@JsonController("/api/users")
export class UsersController {
    private userRepository: Repository<User>;

    constructor() {
        this.userRepository = getConnectionManager().get().getRepository(User);
    }
   
    @Get("/exists/:username")
    public async checkUsername(@Param("username") username: string) {
        const user = await this.userRepository.findOneById(username);
        return user !== undefined;
    }


    @Post("/sign_up")
   public async   signUp(@Body() authData: authData, @Res() res: Response) {
        if (authData.username && authData.email && authData.password) {
            let user = await  this.userRepository.findOneById(authData.username);
            const count = await this.userRepository.count();
            if (!user) {
                user = new User();
                user.username = authData.username;
                user.email = authData.email;
                user = await authService.setHashedPassword(user, authData.password);
                user.admnin = count === 0;


                this.userRepository.persist(user);
                res.send(user);
            }
            else {
                res.send("Already exists");
            }
        } else {
            res.send("Incomplete");
        }
    }


    @Post("/sign_in")
   public async signIn(@Body() authData: authData, @Res() res: Response) {
        if (authData.username && authData.password) {
            let user = await  this.userRepository.findOneById(authData.username);

            if (user) {
                console.log(user);
                const valid = await authService.checkPassword(authData.password, user);
                if (valid) {
                   authService.setTokenForUser(res, user).then(() => {
                        res.send("logged in");
                    });

                } else {
                    res.send("Wrong information");
                }
            } else {
                res.send("Not found");
            }
        } else {
            res.send("Incomplete");
        }
    }

 @Authorized()
    @Get("/auto")
    public async checkAuthentication(@Res() res: Response, @CurrentUser() user: User) {
        res.send(user);
    }

}

