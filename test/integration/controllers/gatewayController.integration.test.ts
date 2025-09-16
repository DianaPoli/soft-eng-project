/**
 * gatewayController.integration.test.ts
 * Creation date: 2025-05-16
 * Last revision date: 2025-05-16
 * SWE Group 54
 */

import * as gatewayController from "@controllers/gatewayController";
import { Gateway as GatewayDTO, Sensor as SensorDTO } from "@dto/index";
import { GatewayDAO, SensorDAO } from "@models/dao";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { mock } from 'node:test';

//mock the GatewayRepository
jest.mock("@repositories/GatewayRepository");

describe("GatewayController integration", () => {

    it("getAllGatewaysByNetworkCode: no sensors - mapperService integration", async () => {
        //mock the GatewayDAO
        const fakeGatewayDAO0: GatewayDAO = {
            gatewayMac: "00:00:00:00:00:01",
            gatewayName: "Test Gateway",
            gatewayDescription: "This is a test gateway",
            network: null, //network (uppper relatrionship) is not eagerly loaed by the gateway repository
            sensors: [] //no sensors attached to the gateway
        };

        //test nullable name and description
        const fakeGatewayDAO1: GatewayDAO = {
            gatewayMac: "00:00:00:00:00:02",
            gatewayName: null,
            gatewayDescription: null,
            network: null, //network (uppper relatrionship) is not eagerly loaed by the gateway repository
            sensors: [] //no sensors attached to the gateway
        };

        //mock the GatewayRepository
        //getAllGatewaysByNetworkCode return Promise<GatewayDAO[]>
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            getAllGatewaysByNetworkCode: jest.fn().mockResolvedValue([fakeGatewayDAO0, fakeGatewayDAO1])
        }));


        //the controller received this from the repository
        //the it callls the mapperService to map the GatewayDAO to GatewayDTO
        const expectedDTO0: GatewayDTO = {
            macAddress: fakeGatewayDAO0.gatewayMac,
            name: fakeGatewayDAO0.gatewayName,
            description: fakeGatewayDAO0.gatewayDescription,
            //sensors is null, so removed
        };
        const expectedDTO1: GatewayDTO = {
            macAddress: fakeGatewayDAO1.gatewayMac,
            //name is null, so removed
            //description is null, so removed
            //sensors is null, so removed
        };

        //call the controller
        const result = await gatewayController.getAllGatewaysByNetworkCode("networkCode");

        const expectedResult: GatewayDTO[] = [expectedDTO0, expectedDTO1];

        //check the result
        expect(result).toHaveLength(expectedResult.length);
        expect(result).toEqual(expectedResult);     
        expect(result[0]).not.toHaveProperty("sensors");
        expect(result[1]).not.toHaveProperty("sensors");
    
    });


    it("getAllGatewaysByNetworkCode: with sensors - mapperService integration", async () => {
        //mock the GatewayDAO
        const fakeGatewayDAO0: GatewayDAO = {
            gatewayMac: "00:00:00:00:00:01",
            gatewayName: "Test Gateway",
            gatewayDescription: "This is a test gateway",
            network: null, //network (uppper relatrionship) is not eagerly loaed by the gateway repository
            sensors: [] //no sensors attached to the gateway
        };

        //mock the SensorDAO
        const fakeSensorDAO0: SensorDAO = {
            sensorMac: "00:00:00:00:00:01",
            sensorName: "Test Sensor",
            sensorDescription: "This is a test sensor",
            sensorVariable: "temperature",
            sensorUnit: "Celsius",
            gateway: null, //gateway (uppper relatrionship) is not eagerly loaed by the sensor repository
            measurements: [] //no measurements attached to the sensor
        };

        fakeGatewayDAO0.sensors.push(fakeSensorDAO0);

        //test nullable name and description
        const fakeGatewayDAO1: GatewayDAO = {
            gatewayMac: "00:00:00:00:00:02",
            gatewayName: null,
            gatewayDescription: null,
            network: null, //network (uppper relatrionship) is not eagerly loaed by the gateway repository
            sensors: [] //no sensors attached to the gateway
        };

        //mock the SensorDAO
        const fakeSensorDAO1: SensorDAO = {
            sensorMac: "00:00:00:00:00:02",
            sensorName: "Test Sensor 2",
            sensorDescription: "This is a test sensor 2",
            sensorVariable: "humidity",
            sensorUnit: "Percentage",
            gateway: null, //gateway (uppper relatrionship) is not eagerly loaed by the sensor repository
            measurements: [{
                id: 1,
                createdAt: new Date(),
                value: 25,
                sensor: null //sensor (uppper relatrionship) is not eagerly loaed by the measurement repository
            }] 
        };

        //the measurements DO NOT need to be returned in the gatewayDTO

        fakeGatewayDAO1.sensors.push(fakeSensorDAO1);

        //mock the GatewayRepository
        //getAllGatewaysByNetworkCode return Promise<GatewayDAO[]>
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            getAllGatewaysByNetworkCode: jest.fn().mockResolvedValue([fakeGatewayDAO0, fakeGatewayDAO1])
        }));

        //the controller received this from the repository
        //the it callls the mapperService to map the GatewayDAO to GatewayDTO
        const expectedDTO0: GatewayDTO = {
            macAddress: fakeGatewayDAO0.gatewayMac,
            name: fakeGatewayDAO0.gatewayName,
            description: fakeGatewayDAO0.gatewayDescription,
            sensors: [
                {
                    macAddress: fakeSensorDAO0.sensorMac,
                    name: fakeSensorDAO0.sensorName,
                    description: fakeSensorDAO0.sensorDescription,
                    variable: fakeSensorDAO0.sensorVariable,
                    unit: fakeSensorDAO0.sensorUnit
                }
            ]
        };

        const expectedDTO1: GatewayDTO = {
            macAddress: fakeGatewayDAO1.gatewayMac,
            //name is null, so removed
            //description is null, so removed
            sensors: [
                {
                    macAddress: fakeSensorDAO1.sensorMac,
                    name: fakeSensorDAO1.sensorName,
                    description: fakeSensorDAO1.sensorDescription,
                    variable: fakeSensorDAO1.sensorVariable,
                    unit: fakeSensorDAO1.sensorUnit
                }
            ]
        };

        //call the controller
        const result = await gatewayController.getAllGatewaysByNetworkCode("networkCode");

        const expectedResult: GatewayDTO[] = [expectedDTO0, expectedDTO1];

        //check the result
        expect(result).toHaveLength(expectedResult.length);
        expect(result).toEqual(expectedResult);
        expect(result[0]).toHaveProperty("sensors");
        expect(result[1]).toHaveProperty("sensors");
        expect(result[0].sensors).toHaveLength(expectedResult[0].sensors.length);
        expect(result[1].sensors).toHaveLength(expectedResult[1].sensors.length);
        expect(result[0].sensors[0]).toEqual(expectedResult[0].sensors[0]);
        expect(result[1].sensors[0]).toEqual(expectedResult[1].sensors[0]);
    
    });

    it("getAllGatewaysByNetworkCode: empty list", async () => {
        //mock the GatewayRepository
        //getAllGatewaysByNetworkCode return Promise<GatewayDAO[]>
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            getAllGatewaysByNetworkCode: jest.fn().mockResolvedValue([])
        }));

        //call the controller
        const result = await gatewayController.getAllGatewaysByNetworkCode("networkCode");

        //check the result
        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
    });

    it("getGatewayByNetworkCodeGatewayMac: no sensors - mapperService integration", async () => {
        //mock the GatewayDAO
        const fakeGatewayDAO: GatewayDAO = {
            gatewayMac: "00:00:00:00:00:01",
            gatewayName: "Test Gateway",
            gatewayDescription: "This is a test gateway",
            network: null, //network (uppper relatrionship) is not eagerly loaed by the gateway repository
            sensors: [] //no sensors attached to the gateway
        };

        //mock the GatewayRepository
        //getAllGatewaysByNetworkCode return Promise<GatewayDAO[]>
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            getGatewayByNetworkCodeGatewayMac: jest.fn().mockResolvedValue(fakeGatewayDAO)
        }));

        //the controller received this from the repository
        //the it callls the mapperService to map the GatewayDAO to GatewayDTO
        const expectedDTO: GatewayDTO = {
            macAddress: fakeGatewayDAO.gatewayMac,
            name: fakeGatewayDAO.gatewayName,
            description: fakeGatewayDAO.gatewayDescription,
            //sensors is null, so removed
        };

        //call the controller
        const result = await gatewayController.getGatewayByNetworkCodeGatewayMac("networkCode", "gatewayMac");

        //check the result
        expect(result).toEqual(expectedDTO);
        expect(result).not.toHaveProperty("sensors");
    });

    it("getGatewayByNetworkCodeGatewayMac: with sensors - mapperService integration", async () => {
        //mock the GatewayDAO
        const fakeGatewayDAO: GatewayDAO = {
            gatewayMac: "00:00:00:00:00:01",
            gatewayName: "Test Gateway",
            gatewayDescription: "This is a test gateway",
            network: null, //network (uppper relatrionship) is not eagerly loaed by the gateway repository
            sensors: [] //no sensors attached to the gateway
        };

        //mock the SensorDAO
        const fakeSensorDAO: SensorDAO = {
            sensorMac: "00:00:00:00:00:01",
            sensorName: "Test Sensor",
            sensorDescription: "This is a test sensor",
            sensorVariable: "temperature",
            sensorUnit: "Celsius",
            gateway: null, //gateway (uppper relatrionship) is not eagerly loaed by the sensor repository
            measurements: [{
                id: 1,
                createdAt: new Date(),
                value: 25,
                sensor: null //sensor (uppper relatrionship) is not eagerly loaed by the measurement repository
            }] 
        };

        //the measurements DO NOT need to be returned in the gatewayDTO

        fakeGatewayDAO.sensors.push(fakeSensorDAO);

        //mock the GatewayRepository
        //getAllGatewaysByNetworkCode return Promise<GatewayDAO[]>
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            getGatewayByNetworkCodeGatewayMac: jest.fn().mockResolvedValue(fakeGatewayDAO)
        }));

        //the controller received this from the repository
        //the it callls the mapperService to map the GatewayDAO to GatewayDTO
        const expectedDTO: GatewayDTO = {
            macAddress: fakeGatewayDAO.gatewayMac,
            name: fakeGatewayDAO.gatewayName,
            description: fakeGatewayDAO.gatewayDescription,
            sensors: [
                {
                    macAddress: fakeSensorDAO.sensorMac,
                    name: fakeSensorDAO.sensorName,
                    description: fakeSensorDAO.sensorDescription,
                    variable: fakeSensorDAO.sensorVariable,
                    unit: fakeSensorDAO.sensorUnit
                }
            ]
        };

        //call the controller
        const result = await gatewayController.getGatewayByNetworkCodeGatewayMac("networkCode", "gatewayMac");

        //check the result
        expect(result).toEqual(expectedDTO);
        expect(result).toHaveProperty("sensors");
        expect(result.sensors).toHaveLength(expectedDTO.sensors.length);
        expect(result.sensors[0]).toEqual(expectedDTO.sensors[0]);
    });

    it("getGatewayByNetworkCodeGatewayMac - test nullable fields", async () => {
        //gateway with null name and description
        //the repo will assign null to the name and description
        const fakeGatewayDAO: GatewayDAO = {
            gatewayMac: "00:00:00:00:00:01",
            gatewayName: null, //NULL in DB
            gatewayDescription: null, //NULL in DB
            network: null, 
            sensors: [] 
        };

        //mock the GatewayRepository
        //getAllGatewaysByNetworkCode return Promise<GatewayDAO[]>
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            getGatewayByNetworkCodeGatewayMac: jest.fn().mockResolvedValue(fakeGatewayDAO)
        }));

        //the controller received this from the repository
        //the it callls the mapperService to map the GatewayDAO to GatewayDTO
        const expectedDTO: GatewayDTO = {
            macAddress: fakeGatewayDAO.gatewayMac,
            //name is null, so removed
            //description is null, so removed
            //sensors is null, so removed
        };

        //call the controller
        const result = await gatewayController.getGatewayByNetworkCodeGatewayMac("networkCode", "gatewayMac");

        //check the result
        expect(result).toEqual(expectedDTO);
        expect(result).not.toHaveProperty("name");
        expect(result).not.toHaveProperty("description");

    });

    it("create gateway: no sensors - mapperService integration", async () => {
        //the controller receives the gatewayDTO from the request
        const fakeGatewayDTO: GatewayDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Test Gateway",
            description: "This is a test gateway",
            sensors: [] //no sensors attached to the gateway
        };

        //mock the GatewayRepository
        //createGateway return Promise<void>
        const mockCreateGateway = jest.fn().mockResolvedValue(undefined);
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            createGateway: mockCreateGateway
        }));

        await gatewayController.createGateway(fakeGatewayDTO, "networkCode");

        //check that the repository was called with the correct parameters
        expect(mockCreateGateway).toHaveBeenCalledWith(
            "networkCode",
            fakeGatewayDTO.macAddress,
            fakeGatewayDTO.name,
            fakeGatewayDTO.description
        );
    });

    it("create gateway: with sensors - mapperService integration", async () => {
        //the controller receives the gatewayDTO from the request
        const fakeGatewayDTO: GatewayDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Test Gateway",
            description: "This is a test gateway",
            sensors: [
                {
                    macAddress: "00:00:00:00:00:01",
                    name: "Test Sensor",
                    description: "This is a test sensor",
                    variable: "temperature",
                    unit: "Celsius"
                }
            ]
        };

        //the sensors NEEDS TO BE IGNORED

        //mock the GatewayRepository
        //createGateway return Promise<void>
        const mockCreateGateway = jest.fn().mockResolvedValue(undefined);
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            createGateway: mockCreateGateway
        }));

        await gatewayController.createGateway(fakeGatewayDTO, "networkCode");

        //check that the repository was called with the correct parameters
        expect(mockCreateGateway).toHaveBeenCalledWith(
            "networkCode",
            fakeGatewayDTO.macAddress,
            fakeGatewayDTO.name,
            fakeGatewayDTO.description
        );
    });

    it("update gateway - mapperService integration", async () => {
        //the controller receives the gatewayDTO from the request, which is the update
        const updateGatewayDTO: GatewayDTO = {
            macAddress: "00:00:00:00:00:01",
            name: "Test Gateway",
            description: "This is a test gateway",
            sensors: [{
                macAddress: "00:00:00:00:00:01",
                name: "Test Sensor",
                description: "This is a test sensor",
                variable: "temperature",
                unit: "Celsius"
            }]
        };

        //mock the GatewayRepository
        //updateGateway return Promise<void>
        const mockUpdateGateway = jest.fn().mockResolvedValue(undefined);
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            updateGateway: mockUpdateGateway
        }));


        //the mapper function has to map the update DTO to the partial DAO
        //sensors will be IGNORED
        const updateAfterMapper : Partial<GatewayDAO> = {
            gatewayMac: updateGatewayDTO.macAddress,
            gatewayName: updateGatewayDTO.name,
            gatewayDescription: updateGatewayDTO.description,
        };


        await gatewayController.updateGateway(updateGatewayDTO, "networkCode", "oldGatewayMac");
        //check that the repository was called with the correct parameters
        expect(mockUpdateGateway).toHaveBeenCalled();
        expect(mockUpdateGateway).toHaveBeenCalledWith(
            "networkCode",
            "oldGatewayMac",
            updateAfterMapper
        );


        //perform another update, just gatewayMac
        const updateGatewayDTOGatewayDTO2: GatewayDTO = {
            macAddress: "00:00:00:00:00:02"
        };

        //mock the GatewayRepository
        //updateGateway return Promise<void>
        const mockUpdateGateway2 = jest.fn().mockResolvedValue(undefined);
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            updateGateway: mockUpdateGateway2
        }));

        //the mapper function has to map the update DTO to the partial DAO
        const updateAfterMapper2 : Partial<GatewayDAO> = {
            gatewayMac: updateGatewayDTOGatewayDTO2.macAddress,
        };

        await gatewayController.updateGateway(updateGatewayDTOGatewayDTO2, "networkCode", "oldGatewayMac");
        //check that the repository was called with the correct parameters
        expect(mockUpdateGateway2).toHaveBeenCalled();
        expect(mockUpdateGateway2).toHaveBeenCalledWith(
            "networkCode",
            "oldGatewayMac",
            updateAfterMapper2
        );
    });

    it("delete gateway - mapperService integration", async () => {
        //mock the GatewayRepository
        //deleteGateway return Promise<void>
        const mockDeleteGateway = jest.fn().mockResolvedValue(undefined);
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            deleteGateway: mockDeleteGateway
        }));

        await gatewayController.deleteGateway("networkCode", "gatewayMac");

        //check that the repository was called with the correct parameters
        expect(mockDeleteGateway).toHaveBeenCalled();
        expect(mockDeleteGateway).toHaveBeenCalledWith(
            "networkCode",
            "gatewayMac"
        );
    });
});