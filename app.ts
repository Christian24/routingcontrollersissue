import * as express from "express";
import * as cors from "cors";
import config from "./config";
import "reflect-metadata";
import {createConnection, getConnectionManager, getEntityManager, useContainer} from "typeorm";
import {authService} from "./services/authservice";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import {Container} from "typedi";
import {createExpressServer, useExpressServer} from "routing-controllers";
import {ActionProperties} from "routing-controllers/ActionProperties";
import {User} from "./models/user";
const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authService.jwtMiddleware);
app.use(cors());
//app.options('*', cors());
useExpressServer(app,{
    controllers: [__dirname + "/routes/*.js"],
    authorizationChecker: async (actionProperties: ActionProperties, roles: string[]) => {
        // here you can use request/response objects from actionProperties
        // also if decorator defines roles it needs to access the action
        // you can use them to provide granular access check
        // checker must return either boolean (true or false)
        // either promise that resolves a boolean value
        // demo code:
        //console.log(actionProperties.request);
        return authService.isAuthenticated(actionProperties.request);

    },
    currentUserChecker: async actionProperties => {
        const username = await authService.getUsername(actionProperties.request);
        console.log(username);
        if(username) {
          return await getEntityManager().getRepository(User).findOneById(username);
        } else {
            return undefined;
        }
    }
})
/*const app = createExpressServer({
    controllers: [__dirname + "/routes/!*.js"],
    authorizationChecker: async (actionProperties: ActionProperties, roles: string[]) => {
        // here you can use request/response objects from actionProperties
        // also if decorator defines roles it needs to access the action
        // you can use them to provide granular access check
        // checker must return either boolean (true or false)
        // either promise that resolves a boolean value
        // demo code:
        //console.log(actionProperties.request);
       return authService.isAuthenticated(actionProperties.request);

    }
});*/


useContainer(Container);
createConnection({
    driver: {
        type: "postgres",
        host: "localhost",
        port: config.db.dbport,
        username: config.db.dbuser,
        password: config.db.dbpassword,
        database: config.db.dbname
    },
    entities: [
        __dirname + "/models/*.js"
    ],
    autoSchemaSync: true,
}).then(connection => {
    // here you can start to work with your entities

   // app.use("/api/users",usersRoute);
    app.listen(config.server.port, () => {
        console.log(`listening on port ${config.server.port}!`);
    });
}).catch(error => console.log(error));
