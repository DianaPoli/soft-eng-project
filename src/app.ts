import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { CONFIG } from "@config";
import { errorHandler } from "@middlewares/errorMiddleware";
import authenticationRouter from "@routes/authenticationRoutes";
import userRouter from "@routes/userRoutes";
import gatewayRouter from "@routes/gatewayRoutes";
import sensorRouter from "@routes/sensorRoutes";
import measurementRouter from "@routes/measurementRoutes";
import networkRouter from "@routes/networkRoutes";
import cors from "cors";
//set up the Open API validator
import * as OpenApiValidator from 'express-openapi-validator';

export const app = express();

app.use(express.json());  
app.use(cors());

//configure the Open API validator middleware, BEFORE the routes
//this will throw an error if the request does not match the swagger spec
//the error will be caught by the error handler middleware
app.use(
  OpenApiValidator.middleware({
    apiSpec: CONFIG.SWAGGER_V1_FILE_PATH, //take the swagger 
    //as of now the policy is: validate all requests from the client, do not validate responses from the server
    validateRequests: true,
    validateResponses: true, //set to to true in development, false in production
  }),
);

app.use(
  CONFIG.ROUTES.V1_SWAGGER,
  swaggerUi.serve,
  swaggerUi.setup(YAML.load(CONFIG.SWAGGER_V1_FILE_PATH))
);

app.use(CONFIG.ROUTES.V1_AUTH, authenticationRouter);
app.use(CONFIG.ROUTES.V1_USERS, userRouter);
app.use(CONFIG.ROUTES.V1_NETWORKS, networkRouter);
app.use(CONFIG.ROUTES.V1_GATEWAYS, gatewayRouter); //first it was CONFIG.ROUTES.V1_GATEWAYS but apprently mergeParams doens't work at least for gateway routes....networkCode was not being passed to the router
app.use(CONFIG.ROUTES.V1_SENSORS, sensorRouter);
app.use(measurementRouter);

//This must always be the last middleware added
app.use(errorHandler);
