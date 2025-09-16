/**
 * sensorController.integration.test.ts
 * Creation date: 2025-05-18
 * Last revision date: 2025-05-18
 * SWE Group 54
 */

import * as sensorController from "@controllers/sensorController";
import { Gateway as GatewayDTO, Sensor as SensorDTO } from "@dto/index";
import { GatewayDAO, SensorDAO } from "@models/dao";
import { SensorRepository } from "@repositories/SensorRepository";
import { mock } from 'node:test';

//mock the SensorRepository
jest.mock("@repositories/SensorRepository");

describe("Sensorontroller integration", () => {

    it("getAllSensorsByNetworkCodeGatewayMac: no measurements - mapperService integration", async () => {
        
        
        // Fake SensorDAO list
        const fakeSensorDAO0: SensorDAO = {
            sensorMac: "00:00:00:00:00:01",
            sensorName: "Temperature Sensor",
            sensorDescription: "Measures temperature",
            sensorVariable: "temperature",
            sensorUnit: "Celsius",
            gateway: null, // not eagerly loaded
            measurements: [] //no measurement attached to the sensor
        };

        const fakeSensorDAO1: SensorDAO = {
            sensorMac: "00:00:00:00:00:02",
            sensorName: null,
            sensorDescription: null,
            sensorVariable: null,
            sensorUnit: null,
            gateway: null, // not eagerly loaded
            measurements: [] //no measurement attached to the sensor
        };

        // Mock the repository method
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            getAllSensorsByNetworkCodeGatewayMac: jest.fn().mockResolvedValue([fakeSensorDAO0, fakeSensorDAO1])
        }));

        // Expected mapped SensorDTOs
        const expectedDTO0: SensorDTO = {
            macAddress: fakeSensorDAO0.sensorMac,
            name: fakeSensorDAO0.sensorName,
            description: fakeSensorDAO0.sensorDescription,
            variable: fakeSensorDAO0.sensorVariable,
            unit: fakeSensorDAO0.sensorUnit
        };

        const expectedDTO1: SensorDTO = {
            macAddress: fakeSensorDAO1.sensorMac,
            // name, description, variable, unir are null — should be excluded

        };

        // Call the controller
        const result = await sensorController.getAllSensorsByNetworkCodeGatewayMac("net001", "00:00:00:00:00:FF");

        const expectedResult: SensorDTO[] = [expectedDTO0, expectedDTO1];
        // Verify result
        expect(result).toHaveLength(expectedResult.length);
        expect(result).toEqual(expectedResult);
        expect(result[0]).toHaveProperty("variable");
        expect(result[1]).not.toHaveProperty("variable");
        expect(result[1]).not.toHaveProperty("name");
        expect(result[1]).not.toHaveProperty("description");
        expect(result[1]).not.toHaveProperty("unit");
    });

    it("getAllSensorsByNetworkCodeGatewayMac: with measurements - mapperService integration", async () => {
        
        
        // Fake SensorDAO list
        const fakeSensorDAO0: SensorDAO = {
            sensorMac: "00:00:00:00:00:01",
            sensorName: "Temperature Sensor",
            sensorDescription: "Measures temperature",
            sensorVariable: "temperature",
            sensorUnit: "Celsius",
            gateway: null, // not eagerly loaded
            measurements: [] //no measurement attached to the sensor
        };

        const fakeSensorDAO1: SensorDAO = {
            sensorMac: "00:00:00:00:00:02",
            sensorName: null,
            sensorDescription: null,
            sensorVariable: null,
            sensorUnit: null,
            gateway: null, // not eagerly loaded
            measurements: [{
                id: 1,
                createdAt: new Date(),
                value: 25,
                sensor: null //sensor (uppper relatrionship) is not eagerly loaed by the measurement repository
            }] 
        };

        // Mock the repository method
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            getAllSensorsByNetworkCodeGatewayMac: jest.fn().mockResolvedValue([fakeSensorDAO0, fakeSensorDAO1])
        }));

        // Expected mapped SensorDTOs
        const expectedDTO0: SensorDTO = {
            macAddress: fakeSensorDAO0.sensorMac,
            name: fakeSensorDAO0.sensorName,
            description: fakeSensorDAO0.sensorDescription,
            variable: fakeSensorDAO0.sensorVariable,
            unit: fakeSensorDAO0.sensorUnit
        };

        const expectedDTO1: SensorDTO = {
            macAddress: fakeSensorDAO1.sensorMac,
            // name, description, variable, unir are null — should be excluded

        };

        // Call the controller
        const result = await sensorController.getAllSensorsByNetworkCodeGatewayMac("net001", "00:00:00:00:00:FF");

        const expectedResult: SensorDTO[] = [expectedDTO0, expectedDTO1];
        // Verify result
        expect(result).toHaveLength(expectedResult.length);
        expect(result).toEqual(expectedResult);
        expect(result[0]).toHaveProperty("variable");
        expect(result[1]).not.toHaveProperty("variable");
        expect(result[1]).not.toHaveProperty("name");
        expect(result[1]).not.toHaveProperty("description");
        expect(result[1]).not.toHaveProperty("unit");
        expect(result[1]).not.toHaveProperty("measurements");
    });

    it("getAllSensorsByNetworkCodeGatewayMac: empty list", async () => {
            
        // Mock the repository method
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            getAllSensorsByNetworkCodeGatewayMac: jest.fn().mockResolvedValue([])
        }));
    
        //call the controller
        const result = await sensorController.getAllSensorsByNetworkCodeGatewayMac("networkCode", "00:00:00:00:00:03");

        //check the result
        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
    });

    it("getGatewayByNetworkCodeGatewayMac: no measurements - mapperService integration", async () => {
        
        // Fake SensorDAO list
        const fakeSensorDAO0: SensorDAO = {
            sensorMac: "00:00:00:00:00:01",
            sensorName: "Temperature Sensor",
            sensorDescription: "Measures temperature",
            sensorVariable: "temperature",
            sensorUnit: null,
            gateway: null, // not eagerly loaded
            measurements: [] //no measurement attached to the sensor
        };


        // Mock the repository method
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            getSensorByNetworkCodeGatewayMacSensorMac: jest.fn().mockResolvedValue(fakeSensorDAO0)
        }));

        const expectedDTO: SensorDTO = {
            macAddress: fakeSensorDAO0.sensorMac,
            name: fakeSensorDAO0.sensorName,
            description: fakeSensorDAO0.sensorDescription,
            variable: fakeSensorDAO0.sensorVariable,
            //unit: fakeSensorDAO0.sensorUnit - unit is null and should be excluded
        };

        //call the controller
        const result = await sensorController.getSensorByNetworkCodeGatewayMacSensorMac("networkCode", "00:00:00:00:00:03", "00:00:00:00:00:01");

        //check the result
        expect(result).toEqual(expectedDTO);
        expect(result).not.toHaveProperty("sensors");
        expect(result).not.toHaveProperty("unit");
    });


    it("getGatewayByNetworkCodeGatewayMac: with measurements - mapperService integration", async () => {
        
        // Fake SensorDAO list
        const fakeSensorDAO0: SensorDAO = {
            sensorMac: "00:00:00:00:00:01",
            sensorName: "Temperature Sensor",
            sensorDescription: "Measures temperature",
            sensorVariable: "temperature",
            sensorUnit: null,
            gateway: null, // not eagerly loaded
            measurements: [{
                id: 1,
                createdAt: new Date(),
                value: 25,
                sensor: null //sensor (uppper relatrionship) is not eagerly loaed by the measurement repository
            }] 
        };


        // Mock the repository method
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            getSensorByNetworkCodeGatewayMacSensorMac: jest.fn().mockResolvedValue(fakeSensorDAO0)
        }));

        const expectedDTO: SensorDTO = {
            macAddress: fakeSensorDAO0.sensorMac,
            name: fakeSensorDAO0.sensorName,
            description: fakeSensorDAO0.sensorDescription,
            variable: fakeSensorDAO0.sensorVariable,
            //unit: fakeSensorDAO0.sensorUnit - unit is null and should be excluded
        };

        //call the controller
        const result = await sensorController.getSensorByNetworkCodeGatewayMacSensorMac("networkCode", "00:00:00:00:00:03", "00:00:00:00:00:01");

        //check the result
        expect(result).toEqual(expectedDTO);
        expect(result).not.toHaveProperty("sensors");
        expect(result).not.toHaveProperty("unit");
    });


    it("getGatewayByNetworkCodeGatewayMac - test nullable fields", async () => {
        
        // Fake SensorDAO list
        const fakeSensorDAO0: SensorDAO = {
            sensorMac: "00:00:00:00:00:01",
            sensorName: null,
            sensorDescription: null,
            sensorVariable: null,
            sensorUnit: null,
            gateway: null, // not eagerly loaded
            measurements: [] //no measurement attached to the sensor
        };


        // Mock the repository method
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            getSensorByNetworkCodeGatewayMacSensorMac: jest.fn().mockResolvedValue(fakeSensorDAO0)
        }));

        const expectedDTO: SensorDTO = {
            macAddress: fakeSensorDAO0.sensorMac,
            //name: fakeSensorDAO0.sensorName, - null
            //description: fakeSensorDAO0.sensorDescription, - null
            //variable: fakeSensorDAO0.sensorVariable, - null
            //unit: fakeSensorDAO0.sensorUnit - null
        };

        //call the controller
        const result = await sensorController.getSensorByNetworkCodeGatewayMacSensorMac("networkCode", "00:00:00:00:00:03", "00:00:00:00:00:01");

        //check the result
        expect(result).toEqual(expectedDTO);
        expect(result).not.toHaveProperty("sensors");
        expect(result).not.toHaveProperty("unit");
        expect(result).not.toHaveProperty("name");
        expect(result).not.toHaveProperty("description");
        expect(result).not.toHaveProperty("variable");
    });

    it("create sensor - mapperService integration", async () => {
        
        // Fake SensorDAO list
        const fakeSensorDTO: SensorDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Temperature Sensor",
            description: "Measures temperature",
            variable: "temperature",
            unit: null
        };

        // Mock the repository method
        const mockCreateSensor = jest.fn().mockResolvedValue(undefined);
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            createSensor: mockCreateSensor
        }));

        
        //call the controller
        const result = await sensorController.createSensor(fakeSensorDTO, "networkCode", "00:00:00:00:00:03");

        //check the result
        expect(mockCreateSensor).toHaveBeenCalledWith(
            "networkCode",
            "00:00:00:00:00:03",
            fakeSensorDTO.macAddress,
            fakeSensorDTO.name,
            fakeSensorDTO.description,
            fakeSensorDTO.variable,
            fakeSensorDTO.unit
        );

    });

    it("update sensor - mapperService integration", async () => {
        //the controller receives the sensorDTO from the request, which is the update
        const updatedSensorDTO: SensorDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Temperature Sensor",
            description: "Measures temperature",
            variable: "temperature",
            unit: "Celsius"
        };

        //mock the SensorRepository
        const mockUpdateSensor = jest.fn().mockResolvedValue(undefined);
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            updateSensor: mockUpdateSensor
        }));


        //the mapper function has to map the update DTO to the partial DAO
        const updateAfterMapper: Partial<SensorDAO> = {
            sensorMac: updatedSensorDTO.macAddress,
            sensorDescription: updatedSensorDTO.description,
            sensorName: updatedSensorDTO.name,
            sensorUnit: updatedSensorDTO.unit,
            sensorVariable: updatedSensorDTO.variable
        };


        await sensorController.updateSensor(updatedSensorDTO, "networkCode", "00:00:00:00:00:03", "oldSensorMac");
        //check that the repository was called with the correct parameters
        expect(mockUpdateSensor).toHaveBeenCalled();
        expect(mockUpdateSensor).toHaveBeenCalledWith(
            "networkCode",
            "00:00:00:00:00:03",
            "oldSensorMac",
            updateAfterMapper
        );


        //perform another update, just sensorMac
        const updatedSensorDTO2: SensorDTO = {
            macAddress: "00:00:00:00:00:02"
        };

        //mock the SensorRepository
        const mockUpdateSensor2 = jest.fn().mockResolvedValue(undefined);
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            updateSensor: mockUpdateSensor2
        }));

        //the mapper function has to map the update DTO to the partial DAO
        const updateAfterMapper2 : Partial<SensorDAO> = {
            sensorMac: updatedSensorDTO2.macAddress,
        };

        await sensorController.updateSensor(updatedSensorDTO2, "networkCode", "00:00:00:00:00:03", "oldSensorMac");
        //check that the repository was called with the correct parameters
        expect(mockUpdateSensor2).toHaveBeenCalled();
        expect(mockUpdateSensor2).toHaveBeenCalledWith(
            "networkCode",
            "00:00:00:00:00:03",
            "oldSensorMac",
            updateAfterMapper2
        );
    });

    it("delete sensor - mapperService integration", async () => {
        
        //mock the SensorRepository
        const mockDeleteSensor = jest.fn().mockResolvedValue(undefined);
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            deleteSensor: mockDeleteSensor
        }));
    
        await sensorController.deleteSensor("networkCode", "gatewayMac", "sensorMac");

        //check that the repository was called with the correct parameters
        expect(mockDeleteSensor).toHaveBeenCalled();
        expect(mockDeleteSensor).toHaveBeenCalledWith(
            "networkCode",
            "gatewayMac",
            "sensorMac"
        );
    });
});