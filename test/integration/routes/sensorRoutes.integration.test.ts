/**
 * sensorRoutes.integration.test.ts
 * Creation date: 2025-05-18
 * Last revision date: 2025-05-18
 * SWE Group 54
 */

import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as sensorController from '@controllers/sensorController';
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
jest.mock("@controllers/sensorController");

describe("Sensor Routes Integration Tests", () => {
    
    const token = "Bearer faketoken";

    afterEach(() => {
        jest.clearAllMocks();
    });


    it("get all sensors of a network and gateway", async () => {

        const mockedSensorDTO0: SensorDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Temperature Sensor",
            description: "Measures temperature",
            variable: "temperature",
            unit: "Celsius"
        };

        const mockedSensorDTO1: SensorDTO = {
            macAddress: "00:00:00:00:00:02"
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (sensorController.getAllSensorsByNetworkCodeGatewayMac as jest.Mock).mockResolvedValue([mockedSensorDTO0, mockedSensorDTO1]);
        const response = await request(app)
            .get("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors")
            .set("Authorization", token);
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual([mockedSensorDTO0, mockedSensorDTO1]);
        expect(sensorController.getAllSensorsByNetworkCodeGatewayMac).toHaveBeenCalledWith("NET01", "00:00:00:00:00:03");
    
    });

    it("get all sensors of a network and gateway - 401 Unauthorized", async () => {

        (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));
        
        const response = await request(app)
            .get("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors")
            .set("Authorization", token);

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
        
    });

    it("get all sensors of a network and gateway - 404 Not Found", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (sensorController.getAllSensorsByNetworkCodeGatewayMac as jest.Mock).mockRejectedValue(new NotFoundError("Entity not found"));
        const response = await request(app)
            .get("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors")
            .set("Authorization", token);
        
        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/not found/);
    });

    it("get a specific sensor", async () => {

        const mockedSensorDTO: SensorDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Temperature Sensor",
            description: "Measures temperature",
            variable: "temperature",
            unit: "Celsius"
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (sensorController.getSensorByNetworkCodeGatewayMacSensorMac as jest.Mock).mockResolvedValue(mockedSensorDTO);
        
        const response = await request(app)
            .get("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01")
            .set("Authorization", token);
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockedSensorDTO);
        expect(sensorController.getSensorByNetworkCodeGatewayMacSensorMac).toHaveBeenCalledWith("00:00:00:00:00:01", "NET01", "00:00:00:00:00:03");
    });

    it("get a specific sensor - 401 Unauthorized", async () => {
        //mock the authService to say: "no, you are not authorized"
        (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));

        const response = await request(app)
            .get("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01")
            .set("Authorization", token);
        
        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("get a specific sensor - 404 Not Found", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (sensorController.getSensorByNetworkCodeGatewayMacSensorMac as jest.Mock).mockRejectedValue(new NotFoundError("Entity not found"));

        const response = await request(app)
            .get("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01")
            .set("Authorization", token);

        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/not found/);
    });

    it("create a new sensor for a gateway - 201 Created", async () => {
        const mockedSensorDTO: SensorDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Temperature Sensor",
            description: "Measures temperature",
            variable: "temperature",
            unit: "Celsius"
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (sensorController.createSensor as jest.Mock).mockResolvedValue(undefined);

        const response = await request(app)
            .post("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors")
            .set("Authorization", token)
            .send(mockedSensorDTO);
        
        expect(response.status).toBe(201);
        expect(sensorController.createSensor).toHaveBeenCalledWith(mockedSensorDTO, "NET01", "00:00:00:00:00:03");
    });

    it("create a new sensor - 400 Bad Request", async () => {
        const requestBody1 = {
            macAddress: 111111,
            name: "Temperature Sensor",
            description: "Measures temperature",
            variable: "temperature",
            unit: "Celsius"
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (sensorController.createSensor as jest.Mock).mockResolvedValue(undefined);
        const response1 = await request(app)
            .post("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors")
            .set("Authorization", token)
            .send(requestBody1);

        expect(response1.status).toBe(400);

        const requestBody2 = {
            macAddress: "00:00:00:00:00:01",
            name: "Temperature Sensor",
            description: 1234,
            variable: "temperature",
            unit: "Celsius"
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (sensorController.createSensor as jest.Mock).mockResolvedValue(undefined);
        const response2 = await request(app)
            .post("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors")
            .set("Authorization", token)
            .send(requestBody2);

        expect(response2.status).toBe(400);
    });

    it("create a new sensor - 401 Unauthorized", async () => {
        //mock the authService to say: "no, you are not authorized"
        (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));

        const mockedSensorDTO: SensorDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Temperature Sensor",
            description: "Measures temperature",
            variable: "temperature",
            unit: "Celsius"
        };

        const response = await request(app)
            .post("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors")
            .set("Authorization", token)
            .send(mockedSensorDTO);

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("create a new sensor - 403 Insufficient rights", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (sensorController.createSensor as jest.Mock).mockRejectedValue(new InsufficientRightsError("Insufficient rights"));

        const mockedSensorDTO: SensorDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Temperature Sensor",
            description: "Measures temperature",
            variable: "temperature",
            unit: "Celsius"
        };

        const response = await request(app)
            .post("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors")
            .set("Authorization", token)
            .send(mockedSensorDTO);

        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("create a new sensor - 409 Conflict", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (sensorController.createSensor as jest.Mock).mockRejectedValue(new ConflictError("Entity with code xxxxx already exists"));

        const mockedSensorDTO: SensorDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Temperature Sensor",
            description: "Measures temperature",
            variable: "temperature",
            unit: "Celsius"
        };

        const response = await request(app)
            .post("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors")
            .set("Authorization", token)
            .send(mockedSensorDTO);


        expect(response.status).toBe(409);
        expect(response.body.message).toMatch(/already exists/);
    }); 


    it("update a sensor - 204 No Content", async () => {
        const mockedSensorDTO: SensorDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Temperature Sensor",
            description: "Measures temperature",
            variable: "temperature",
            unit: "Celsius"
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (sensorController.updateSensor as jest.Mock).mockResolvedValue(undefined);

        const response = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01")
            .set("Authorization", token)
            .send(mockedSensorDTO);
        
        expect(response.status).toBe(204);
        expect(sensorController.updateSensor).toHaveBeenCalledWith(mockedSensorDTO, "NET01", "00:00:00:00:00:03", "00:00:00:00:00:01");
    });

    it("update a sensor - 400 Bad Request", async () => {
        const requestBody1 = {
            macAddress: 111111,
            name: "Temperature Sensor",
            description: "Measures temperature",
            variable: "temperature",
            unit: "Celsius"
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (sensorController.updateSensor as jest.Mock).mockResolvedValue(undefined);
        const response1 = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01")
            .set("Authorization", token)
            .send(requestBody1);

        expect(response1.status).toBe(400);

        const requestBody2 = {
            macAddress: "00:00:00:00:00:01",
            name: "Temperature Sensor",
            description: 1234,
            variable: "temperature",
            unit: "Celsius"
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (sensorController.updateSensor as jest.Mock).mockResolvedValue(undefined);
        const response2 = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01")
            .set("Authorization", token)
            .send(requestBody2);

        expect(response2.status).toBe(400);
    });

    it("update a sensor - 401 Unauthorized", async () => {
        //mock the authService to say: "no, you are not authorized"
        (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));

        const mockedSensorDTO: SensorDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Temperature Sensor",
            description: "Measures temperature",
            variable: "temperature",
            unit: "Celsius"
        };

        const response = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01")
            .set("Authorization", token)
            .send(mockedSensorDTO);
        
        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("update a sensor - 403 Insufficient rights", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (sensorController.updateSensor as jest.Mock).mockRejectedValue(new InsufficientRightsError("Insufficient rights"));

        const mockedSensorDTO: SensorDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Temperature Sensor",
            description: "Measures temperature",
            variable: "temperature",
            unit: "Celsius"
        };

        const response = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01")
            .set("Authorization", token)
            .send(mockedSensorDTO);

        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("update a sensor - 404 Not Found", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);

        (sensorController.updateSensor as jest.Mock).mockRejectedValue(new NotFoundError("Entity not found"));
        const mockedSensorDTO: SensorDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Temperature Sensor",
            description: "Measures temperature",
            variable: "temperature",
            unit: "Celsius"
        };

        const response = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01")
            .set("Authorization", token)
            .send(mockedSensorDTO);
        
        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/not found/);

    });

    it("update a gateway - 409 Conflict", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (sensorController.updateSensor as jest.Mock).mockRejectedValue(new ConflictError("Entity with code xxxxx already exists"));

        const mockedSensorDTO: SensorDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Temperature Sensor",
            description: "Measures temperature",
            variable: "temperature",
            unit: "Celsius"
        };

        const response = await request(app)
            .patch("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01")
            .set("Authorization", token)
            .send(mockedSensorDTO);
        

        expect(response.status).toBe(409);
        expect(response.body.message).toMatch(/already exists/);
    });

    it("delete a sensor - 204 No Content", async () => {
        //always authorized, for each type of user
        //i.e. in this case we mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (sensorController.deleteSensor as jest.Mock).mockResolvedValue(undefined);

        const response = await request(app)
            .delete("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01")
            .set("Authorization", token)

        expect(response.status).toBe(204);
        expect(sensorController.deleteSensor).toHaveBeenCalledWith("NET01", "00:00:00:00:00:03", "00:00:00:00:00:01");
    });

    it("delete a sensor - 401 Unauthorized", async () => {
        //mock the authService to say: "no, you are not authorized"
        (authService.processToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Unauthorized"));

        const response = await request(app)
            .delete("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01")
            .set("Authorization", token)

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("delete a sensor - 403 Insufficient rights", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (sensorController.deleteSensor as jest.Mock).mockRejectedValue(new InsufficientRightsError("Insufficient rights"));

        const response = await request(app)
            .delete("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01")
            .set("Authorization", token)

        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("delete a sensor - 404 Not Found", async () => {
        //mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);

        (sensorController.deleteSensor as jest.Mock).mockRejectedValue(new NotFoundError("Entity not found"));


        const response = await request(app)
            .delete("/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01")
            .set("Authorization", token)
        
        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/not found/);

    });
});