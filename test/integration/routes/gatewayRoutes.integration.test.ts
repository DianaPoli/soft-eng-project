/**
 * gatewayRoutes.integration.test.ts
 * Creation date: 2025-05-16
 * Last revision date: 2025-05-16
 * SWE Group 54
 */

import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as gatewayController from '@controllers/gatewayController';
import { Gateway as GatewayDTO, Sensor as SensorDTO } from "@models/dto";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { UserType } from "@models/UserType";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import { Entity } from 'typeorm';
import { readdirSync } from 'fs';


//mock 
jest.mock("@services/authService");
jest.mock("@controllers/gatewayController");

describe("Gateway Routes Integration Tests", () => {
    
    const token = "Bearer faketoken";

    afterEach(() => {
        jest.clearAllMocks();
    });


    it("get all gateways of a network - no nested entities", async () => {

        const mockedGatewayDTO0: GatewayDTO = {
            macAddress: "00:00:00:00:00:01"
            //just macAddress is required
        };

        const mockedGatewayDTO1: GatewayDTO = {
            macAddress: "00:00:00:00:00:02",
            name: "Gateway 2",
            description: "Test Gateway 2",
        };

        const mockedGatewayDTOs: GatewayDTO[] = [mockedGatewayDTO0, mockedGatewayDTO1];

        //always authorized, for each type of user
        //i.e. in this case we mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (gatewayController.getAllGatewaysByNetworkCode as jest.Mock).mockResolvedValue(mockedGatewayDTOs);

        const response = await request(app)
            .get("/api/v1/networks/NET01/gateways")
            .set("Authorization", token);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockedGatewayDTOs);
        expect(gatewayController.getAllGatewaysByNetworkCode).toHaveBeenCalledWith("NET01");
    });

    it("get all gateways of a network - nested entities", async () => {
        //mocked gateway with sensors
        const mockedSensorDTO: SensorDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Sensor 1",
            description: "Test Sensor",
            variable: "temperature",
            unit: "Celsius"
        };

        const mockedGatewayDTO: GatewayDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Gateway 1",
            description: "Test Gateway",
            sensors: [mockedSensorDTO]
        };

        const mockedGatewayDTOs: GatewayDTO[] = [mockedGatewayDTO];

        //always authorized, for each type of user
        //i.e. in this case we mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (gatewayController.getAllGatewaysByNetworkCode as jest.Mock).mockResolvedValue(mockedGatewayDTOs);

        const response = await request(app)
            .get("/api/v1/networks/NET01/gateways")
            .set("Authorization", token);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockedGatewayDTOs);
        expect(response.body[0].sensors).toEqual(mockedGatewayDTO.sensors);
        expect(gatewayController.getAllGatewaysByNetworkCode).toHaveBeenCalledWith("NET01");


    });    


    it("get all gateways of a network - 401 Unauthorized", async () => {
        //mock the authService to say: "no, you are not authorized"
        (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));

        const response = await request(app)
            .get("/api/v1/networks/NET01/gateways")
            .set("Authorization", token);

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("get all gateways of a network - 404 Not Found", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (gatewayController.getAllGatewaysByNetworkCode as jest.Mock).mockRejectedValue(new NotFoundError("Entity not found"));

        const response = await request(app)
            .get("/api/v1/networks/NET01/gateways")
            .set("Authorization", token);

        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/not found/);
    });

    it("get a specific gateway - no nested entities", async () => {
        const mockedGatewayDTO: GatewayDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Gateway 1",
            description: "Test Gateway",
        };

        //always authorized, for each type of user
        //i.e. in this case we mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (gatewayController.getGatewayByNetworkCodeGatewayMac as jest.Mock).mockResolvedValue(mockedGatewayDTO);

        const response = await request(app)
            .get("/api/v1/networks/NET01/gateways/00:00:00:00:00:01")
            .set("Authorization", token);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockedGatewayDTO);
        expect(gatewayController.getGatewayByNetworkCodeGatewayMac).toHaveBeenCalledWith("00:00:00:00:00:01", "NET01");
    });

    it("get a specific gateway - nested entities", async () => {
        //mocked gateway with sensors
        const mockedSensorDTO: SensorDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Sensor 1",
            description: "Test Sensor",
            variable: "temperature",
            unit: "Celsius"
        };

        const mockedGatewayDTO: GatewayDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Gateway 1",
            description: "Test Gateway",
            sensors: [mockedSensorDTO]
        };

        //always authorized, for each type of user
        //i.e. in this case we mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (gatewayController.getGatewayByNetworkCodeGatewayMac as jest.Mock).mockResolvedValue(mockedGatewayDTO);

        const response = await request(app)
            .get("/api/v1/networks/NET01/gateways/00:00:00:00:00:01")
            .set("Authorization", token);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockedGatewayDTO);
        expect(response.body.sensors).toEqual(mockedGatewayDTO.sensors);
        expect(gatewayController.getGatewayByNetworkCodeGatewayMac).toHaveBeenCalledWith("00:00:00:00:00:01", "NET01");
    });

    it("get a specific gateway - 401 Unauthorized", async () => {
        //mock the authService to say: "no, you are not authorized"
        (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));

        const response = await request(app)
            .get("/api/v1/networks/NET01/gateways/00:00:00:00:00:01")
            .set("Authorization", token);

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("get a specific gateway - 404 Not Found", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (gatewayController.getGatewayByNetworkCodeGatewayMac as jest.Mock).mockRejectedValue(new NotFoundError("Entity not found"));

        const response = await request(app)
            .get("/api/v1/networks/NET01/gateways/00:00:00:00:00:01")
            .set("Authorization", token);

        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/not found/);
    });

    it("create a new gateway - 201 Created", async () => {
        const mockedGatewayDTO: GatewayDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Gateway 1",
            description: "Test Gateway",
        };

        //always authorized, for each type of user
        //i.e. in this case we mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (gatewayController.createGateway as jest.Mock).mockResolvedValue(undefined);

        const response = await request(app)
            .post("/api/v1/networks/NET01/gateways")
            .set("Authorization", token)
            .send(mockedGatewayDTO);

        expect(response.status).toBe(201);
        expect(gatewayController.createGateway).toHaveBeenCalledWith(mockedGatewayDTO, "NET01");
    });

    it("create a new gateway - 400 Bad Request", async () => {
        const reqBody = {
            macAddress: 111111, //invalid type
            name: "Gateway 1",
            description: "Test Gateway",
        };

        //always authorized, for each type of user
        //i.e. in this case we mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (gatewayController.createGateway as jest.Mock).mockResolvedValue(undefined);
        const response = await request(app)
            .post("/api/v1/networks/NET01/gateways")
            .set("Authorization", token)
            .send(reqBody);

        expect(response.status).toBe(400);
        
        const reqBody2 = {
            macAddress: "00:00:00:00:00:01",
            name: "Gateway 1",
            description: [1, 2, 3], //invalid type
        };


        const response2 = await request(app)
            .post("/api/v1/networks/NET01/gateways")
            .set("Authorization", token)
            .send(reqBody2);

        expect(response2.status).toBe(400);

        const reqBody3 = {
            macAddress: "00:00:00:00:00:01",
            name: "Gateway 1",
            description: "Test Gateway",
            sensors: [
                {
                    macAddress: "00:00:00:00:00:01",
                    name: 123, //invalid type
                    description: "Test Sensor",
                    variable: "temperature",
                    unit: "Celsius"
                }
            ]
        };

        const response3 = await request(app)
            .post("/api/v1/networks/NET01/gateways")
            .set("Authorization", token)
            .send(reqBody3);

        expect(response3.status).toBe(400);
    });

    it("create a new gateway - 401 Unauthorized", async () => {
        //mock the authService to say: "no, you are not authorized"
        (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));

        const mockedGatewayDTO: GatewayDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Gateway 1",
            description: "Test Gateway",
        };

        const response = await request(app)
            .post("/api/v1/networks/NET01/gateways")
            .set("Authorization", token)
            .send(mockedGatewayDTO);

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });


    it("create a new gateway - 403 Insufficient rights", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (gatewayController.createGateway as jest.Mock).mockRejectedValue(new InsufficientRightsError("Insufficient rights"));

        const mockedGatewayDTO: GatewayDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Gateway 1",
            description: "Test Gateway",
        };

        const response = await request(app)
            .post("/api/v1/networks/NET01/gateways")
            .set("Authorization", token)
            .send(mockedGatewayDTO);

        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("create a new gateway - 409 Conflict", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (gatewayController.createGateway as jest.Mock).mockRejectedValue(new ConflictError("Entity with code xxxxx already exists"));

        const mockedGatewayDTO: GatewayDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Gateway 1",
            description: "Test Gateway",
        };

        const response = await request(app)
            .post("/api/v1/networks/NET01/gateways")
            .set("Authorization", token)
            .send(mockedGatewayDTO);

        expect(response.status).toBe(409);
        expect(response.body.message).toMatch(/already exists/);
    });


    it("update a gateway - 204 No Content", async () => {
        const mockedGatewayDTO: GatewayDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Gateway 1",
            description: "Test Gateway",
        };

        //always authorized, for each type of user
        //i.e. in this case we mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (gatewayController.updateGateway as jest.Mock).mockResolvedValue(undefined);

        const response = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:00:00:00:00:01")
            .set("Authorization", token)
            .send(mockedGatewayDTO);

        expect(response.status).toBe(204);
        expect(gatewayController.updateGateway).toHaveBeenCalledWith(mockedGatewayDTO, "NET01", "00:00:00:00:00:01");
    });

    it("update a gateway - 400 Bad Request", async () => {
        const reqBody = {
            macAddress: 111111, //invalid type
            name: "Gateway 1",
            description: "Test Gateway",
        };

        //always authorized, for each type of user
        //i.e. in this case we mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (gatewayController.updateGateway as jest.Mock).mockResolvedValue(undefined);
        const response = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:00:00:00:00:01")
            .set("Authorization", token)
            .send(reqBody);

        expect(response.status).toBe(400);
        
        const reqBody2 = {
            macAddress: "00:00:00:00:00:01",
            name: "Gateway 1",
            description: [1, 2, 3], //invalid type
        };

        const response2 = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:00:00:00:00:01")
            .set("Authorization", token)
            .send(reqBody2);
        expect(response2.status).toBe(400);

        const reqBody3 = {
            macAddress: "00:00:00:00:00:01",
            name: "Gateway 1",
            description: "Test Gateway",
            sensors: [
                {
                    macAddress: "00:00:00:00:00:01",
                    name: 123, //invalid type
                    description: "Test Sensor",
                    variable: "temperature",
                    unit: "Celsius"
                }
            ]
        };

        const response3 = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:00:00:00:00:01")
            .set("Authorization", token)
            .send(reqBody3);

        expect(response3.status).toBe(400);
    });

    it("update a gateway - 401 Unauthorized", async () => {
        //mock the authService to say: "no, you are not authorized"
        (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));

        const mockedGatewayDTO: GatewayDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Gateway 1",
            description: "Test Gateway",
        };

        const response = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:00:00:00:00:01")
            .set("Authorization", token)
            .send(mockedGatewayDTO);

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("update a gateway - 403 Insufficient rights", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (gatewayController.updateGateway as jest.Mock).mockRejectedValue(new InsufficientRightsError("Insufficient rights"));

        const mockedGatewayDTO: GatewayDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Gateway 1",
            description: "Test Gateway",
        };

        const response = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:00:00:00:00:01")
            .set("Authorization", token)
            .send(mockedGatewayDTO);

        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("update a gateway - 404 Not Found", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);

        (gatewayController.updateGateway as jest.Mock).mockRejectedValue(new NotFoundError("Entity not found"));
        const mockedGatewayDTO: GatewayDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Gateway 1",
            description: "Test Gateway",
        };

        const response = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:00:00:00:00:01")
            .set("Authorization", token)
            .send(mockedGatewayDTO);
        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/not found/);

    });

    it("update a gateway - 409 Conflict", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (gatewayController.updateGateway as jest.Mock).mockRejectedValue(new ConflictError("Entity with code xxxxx already exists"));

        const mockedGatewayDTO: GatewayDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Gateway 1",
            description: "Test Gateway",
        };

        const response = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:00:00:00:00:01")
            .set("Authorization", token)
            .send(mockedGatewayDTO);

        expect(response.status).toBe(409);
        expect(response.body.message).toMatch(/already exists/);
    });

    it("delete a gateway - 204 No Content", async () => {
        //always authorized, for each type of user
        //i.e. in this case we mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (gatewayController.deleteGateway as jest.Mock).mockResolvedValue(undefined);

        const response = await request(app)
            .delete("/api/v1/networks/NET01/gateways/00:00:00:00:00:01")
            .set("Authorization", token);

        expect(response.status).toBe(204);
        expect(gatewayController.deleteGateway).toHaveBeenCalledWith("NET01", "00:00:00:00:00:01");
    });

    it("delete a gateway - 401 Unauthorized", async () => {
        //mock the authService to say: "no, you are not authorized"
        (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));

        const response = await request(app)
            .delete("/api/v1/networks/NET01/gateways/00:00:00:00:00:01")
            .set("Authorization", token);

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("delete a gateway - 403 Insufficient rights", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (gatewayController.deleteGateway as jest.Mock).mockRejectedValue(new InsufficientRightsError("Insufficient rights"));

        const response = await request(app)
            .delete("/api/v1/networks/NET01/gateways/00:00:00:00:00:01")
            .set("Authorization", token);

        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/Insufficient rights/);
    });
    




});