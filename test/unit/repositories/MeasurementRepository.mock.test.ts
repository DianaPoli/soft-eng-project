import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { MeasurementRepository, SensorRepository } from "@repositories/index";
import { NetworkDAO } from "@dao/NetworkDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import { Between, In } from "typeorm";
import { AppDataSource } from "@database";


const mockFind = jest.fn();
const mockSave = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockFindOne = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      find: mockFind,
      findOne: mockFindOne,
      save: mockSave,
      update: mockUpdate,
      delete: mockDelete,
    })
  }
}));



describe("MeasurementRepository: mocked database", () => {

    const repo = new MeasurementRepository();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("create measurement", async () => {
        // Simulate an existing sensor
        const existingSensor = new SensorDAO();
        existingSensor.sensorMac = "33:33:33:33:33:33";
        existingSensor.sensorName = "Sensor Name 1";
        existingSensor.sensorDescription = "Sensor Description 1";
        existingSensor.sensorVariable = "Temperature";
        existingSensor.sensorUnit = "Celsius";
        existingSensor.gateway = new GatewayDAO();
        existingSensor.gateway.gatewayMac = "11:11:11:11:11:11";
        existingSensor.gateway.gatewayName = "Gateway Name 1";
        existingSensor.gateway.gatewayDescription = "G Description 1";
        existingSensor.gateway.network = new NetworkDAO();
        existingSensor.gateway.network.networkCode = "networkCode1";
        existingSensor.gateway.network.networkName = "Network Name";
        existingSensor.gateway.network.networkDescription = "Description 1";
        mockFindOne.mockResolvedValue(existingSensor);

        // Simulate a new measurement
        const newMeasurement = new MeasurementDAO();
        newMeasurement.createdAt = new Date("2025-05-01T10:00:00Z");
        newMeasurement.value = 25.5;
        newMeasurement.sensor = existingSensor;
        mockSave.mockResolvedValue(newMeasurement);
        const result = await repo.createMeasurement("networkCode1", "11:11:11:11:11:11", "33:33:33:33:33:33", new Date("2025-05-01T10:00:00Z"), 25.5);

        //Now check that the saved measurement is the same as the one we created
        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(MeasurementDAO);
        expect(result.createdAt).toEqual(new Date("2025-05-01T10:00:00Z"));
        expect(result.value).toEqual(25.5);
        expect(result.sensor.sensorMac).toEqual("33:33:33:33:33:33");
        expect(result.sensor.sensorName).toEqual("Sensor Name 1");
        expect(result.sensor.sensorDescription).toEqual("Sensor Description 1");
        expect(result.sensor.sensorVariable).toEqual("Temperature");
        expect(result.sensor.sensorUnit).toEqual("Celsius");
        expect(result.sensor.gateway.gatewayMac).toEqual("11:11:11:11:11:11");
        expect(result.sensor.gateway.gatewayName).toEqual("Gateway Name 1");
        expect(result.sensor.gateway.gatewayDescription).toEqual("G Description 1");
        expect(result.sensor.gateway.network.networkCode).toEqual("networkCode1");
        expect(result.sensor.gateway.network.networkName).toEqual("Network Name");
        expect(result.sensor.gateway.network.networkDescription).toEqual("Description 1");

        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                sensorMac: "33:33:33:33:33:33",
                
            },     
            relations: ["gateway", "gateway.network"]
        });

    });

    it("create measurement: sensor not found - NotFoundError thrown", async () => {

        //Simulate a sensor not present in the database
        mockFindOne.mockResolvedValue(undefined);

        //Now try to create a new measurement inserting a sensorMac not present in the database
        //A NotFoundError should be thrown
        await expect(repo.createMeasurement("networkCode1", "11:11:11:11:11:11", "33:33:33:33:33:33", new Date("2025-05-01T10:00:00Z"), 25.5)).rejects.toThrow(NotFoundError);


        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                sensorMac: "33:33:33:33:33:33",
                
            },     
            relations: ["gateway", "gateway.network"]
        });

    });

    it("create measurement: incorrect gatewayMac  - NotFoundError thrown", async () => {
        // Simulate an existing sensor
        const existingSensor = new SensorDAO();
        existingSensor.sensorMac = "33:33:33:33:33:33";
        existingSensor.sensorName = "Sensor Name 1";
        existingSensor.sensorDescription = "Sensor Description 1";
        existingSensor.sensorVariable = "Temperature";
        existingSensor.sensorUnit = "Celsius";

        existingSensor.gateway = new GatewayDAO();
        existingSensor.gateway.gatewayMac = "11:11:11:11:11:11";
        existingSensor.gateway.gatewayName = "Gateway Name 1";
        existingSensor.gateway.gatewayDescription = "G Description 1";

        existingSensor.gateway.network = new NetworkDAO();
        existingSensor.gateway.network.networkCode = "networkCode1";
        existingSensor.gateway.network.networkName = "Network Name";
        existingSensor.gateway.network.networkDescription = "Description 1";
        mockFindOne.mockResolvedValue(existingSensor);


        //Now try to create a new measurement inserting a gatewayMac different from the one linked to the sensor
        //A NotFoundError should be thrown
        await expect(repo.createMeasurement("networkCode1", "22:22:22:22:22:22", "33:33:33:33:33:33", new Date("2025-05-01T10:00:00Z"), 25.5)).rejects.toThrow(NotFoundError);


        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                sensorMac: "33:33:33:33:33:33",
                
            },     
            relations: ["gateway", "gateway.network"]
        });

    });

    it("create measurement: incorrect networkCode  - NotFoundError thrown", async () => {
        // Simulate an existing sensor
        const existingSensor = new SensorDAO();
        existingSensor.sensorMac = "33:33:33:33:33:33";
        existingSensor.sensorName = "Sensor Name 1";
        existingSensor.sensorDescription = "Sensor Description 1";
        existingSensor.sensorVariable = "Temperature";
        existingSensor.sensorUnit = "Celsius";

        existingSensor.gateway = new GatewayDAO();
        existingSensor.gateway.gatewayMac = "11:11:11:11:11:11";
        existingSensor.gateway.gatewayName = "Gateway Name 1";
        existingSensor.gateway.gatewayDescription = "G Description 1";

        existingSensor.gateway.network = new NetworkDAO();
        existingSensor.gateway.network.networkCode = "networkCode1";
        existingSensor.gateway.network.networkName = "Network Name";
        existingSensor.gateway.network.networkDescription = "Description 1";
        mockFindOne.mockResolvedValue(existingSensor);


        //Now try to create a new measurement inserting a networkCode different from the one linked to the sensor
        //A NotFoundError should be thrown
        await expect(repo.createMeasurement("wrongCode", "11:11:11:11:11:11", "33:33:33:33:33:33", new Date("2025-05-01T10:00:00Z"), 25.5)).rejects.toThrow(NotFoundError);


        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                sensorMac: "33:33:33:33:33:33",
                
            },     
            relations: ["gateway", "gateway.network"]
        });

    });

    it("getMeasurementsBySensor without starDate or endDate", async () => {
        const sensorMac = "33:33:33:33:33:33";
        const gatewayMac = "11:11:11:11:11:11";
        const networkCode = "networkCode1";
       
        // Set up the measurement sensor & network hierarchy
        const sensor = new SensorDAO();
        sensor.sensorMac = "33:33:33:33:33:33";
        sensor.sensorName = "Sensor Name 1";
        sensor.sensorDescription = "Sensor Description 1";
        sensor.sensorVariable = "Temperature";
        sensor.sensorUnit = "Celsius";
    
        sensor.gateway = new GatewayDAO();
        sensor.gateway.gatewayMac = "11:11:11:11:11:11";
        sensor.gateway.gatewayName = "Gateway Name 1";
        sensor.gateway.gatewayDescription = "G Description 1";
    
        sensor.gateway.network = new NetworkDAO();
        sensor.gateway.network.networkCode = "networkCode1";
        sensor.gateway.network.networkName = "Network Name";
        sensor.gateway.network.networkDescription = "Description 1";
    
        // Measurements
        const measurement1 = new MeasurementDAO();
        measurement1.createdAt = new Date("2025-05-01T10:00:00Z");
        measurement1.value = 25.5;
        measurement1.sensor = sensor;
    
        const measurement2 = new MeasurementDAO();
        measurement2.createdAt = new Date("2025-05-01T11:00:00Z");
        measurement2.value = 26.0;
        measurement2.sensor = sensor;
    
        const mockMeasurements = [measurement1, measurement2];
    
        mockFind.mockResolvedValue(mockMeasurements);
          
        const result = await repo.getMeasurementsBySensor("networkCode1", "11:11:11:11:11:11", "33:33:33:33:33:33");
    
        expect(result).toBeDefined();
        expect(result.length).toBe(2);
        expect(result[0].value).toBe(25.5);
        expect(result[1].value).toBe(26.0);
        expect(result[0].sensor.sensorMac).toBe("33:33:33:33:33:33");
    
        // Verify chaining was called properly
        expect(mockFind).toHaveBeenCalledWith({
        where: {
        sensor: {
            sensorMac: sensorMac,
            gateway: {
            gatewayMac: gatewayMac,
            network: {
                networkCode: networkCode
            }
            }
        }
        },
        relations: ["sensor", "sensor.gateway", "sensor.gateway.network"],
  });

    });
    
    it("getMeasurementsBySensor with startDate and endDate", async () => {
        // Set up the measurement sensor & network hierarchy
        const sensor = new SensorDAO();
        sensor.sensorMac = "33:33:33:33:33:33";
        sensor.sensorName = "Sensor Name 1";
        sensor.sensorDescription = "Sensor Description 1";
        sensor.sensorVariable = "Temperature";
        sensor.sensorUnit = "Celsius";
    
        sensor.gateway = new GatewayDAO();
        sensor.gateway.gatewayMac = "11:11:11:11:11:11";
        sensor.gateway.gatewayName = "Gateway Name 1";
        sensor.gateway.gatewayDescription = "G Description 1";
    
        sensor.gateway.network = new NetworkDAO();
        sensor.gateway.network.networkCode = "networkCode1";
        sensor.gateway.network.networkName = "Network Name";
        sensor.gateway.network.networkDescription = "Description 1";
    
        // Define time range
        const startDate = new Date("2025-05-01T00:00:00Z");
        const endDate = new Date("2025-05-02T00:00:00Z");
    
        // Measurements
        const measurement1 = new MeasurementDAO();
        measurement1.createdAt = new Date("2025-05-01T10:00:00Z");
        measurement1.value = 25.5;
        measurement1.sensor = sensor;
    
        const measurement2 = new MeasurementDAO();
        measurement2.createdAt = new Date("2025-05-01T11:00:00Z");
        measurement2.value = 26.0;
        measurement2.sensor = sensor;
    
        const mockMeasurements = [measurement1, measurement2];
 
        mockFind.mockResolvedValue(mockMeasurements);
    
        // Inject mock repo directly into private field
        (repo as any).MeasurementRepo = {
           find: mockFind,
        };
    
        // Call the method with date filters
        const result = await repo.getMeasurementsBySensor("networkCode1", "11:11:11:11:11:11", "33:33:33:33:33:33", startDate, endDate);
    
        expect(result).toBeDefined();
        expect(result.length).toBe(2);
        expect(result[0].value).toBe(25.5);
        expect(result[1].value).toBe(26.0);
    
        // Validate that all expected chaining happened
        expect(mockFind).toHaveBeenCalledWith({
        where: {
            sensor: {
                sensorMac: "33:33:33:33:33:33",
                gateway: {
                    gatewayMac: "11:11:11:11:11:11",
                    network: {
                        networkCode: "networkCode1",
                    },
                },
            },
            createdAt: Between(startDate, endDate),
        },
        relations: ["sensor", "sensor.gateway", "sensor.gateway.network"],
    });
});

    it("getMeasurementsBySensor with startDate and endDate that return no data", async () => {
        // Set up the sensor and its hierarchy
        const sensor = new SensorDAO();
        sensor.sensorMac = "33:33:33:33:33:33";
        sensor.sensorName = "Sensor Name 1";
        sensor.sensorDescription = "Sensor Description 1";
        sensor.sensorVariable = "Temperature";
        sensor.sensorUnit = "Celsius";

        sensor.gateway = new GatewayDAO();
        sensor.gateway.gatewayMac = "11:11:11:11:11:11";
        sensor.gateway.gatewayName = "Gateway Name 1";
        sensor.gateway.gatewayDescription = "G Description 1";

        sensor.gateway.network = new NetworkDAO();
        sensor.gateway.network.networkCode = "networkCode1";
        sensor.gateway.network.networkName = "Network Name";
        sensor.gateway.network.networkDescription = "Description 1";


        // Measurements
        const measurement1 = new MeasurementDAO();
        measurement1.createdAt = new Date("2025-05-02T10:00:00Z");
        measurement1.value = 25.5;
        measurement1.sensor = sensor;
    
        const measurement2 = new MeasurementDAO();
        measurement2.createdAt = new Date("2025-05-02T11:00:00Z");
        measurement2.value = 26.0;
        measurement2.sensor = sensor;

        // Define time range outside of any real measurements
        const startDate = new Date("2024-01-01T00:00:00Z");
        const endDate = new Date("2024-01-01T00:00:00Z");

        mockFind.mockResolvedValue([]);
        (repo as any).MeasurementRepo = {
            find: mockFind,
        };
        
        //Expect the method to return an empty array
        const result = await repo.getMeasurementsBySensor("networkCode1", "11:11:11:11:11:11", "33:33:33:33:33:33", startDate, endDate);
        expect(result).toBeDefined();
        expect(result.length).toBe(0);
        expect(result).toEqual([]);

        // Verify query builder behavior
        expect(mockFind).toHaveBeenCalledWith({
        where: {
            sensor: {
                sensorMac: "33:33:33:33:33:33",
                gateway: {
                    gatewayMac: "11:11:11:11:11:11",
                    network: {
                        networkCode: "networkCode1",
                    },
                },
            },
            createdAt: Between(startDate, endDate),
        },
        relations: ["sensor", "sensor.gateway", "sensor.gateway.network"],
    });
    });

    it("getMeasurementsBySensor - test just one date", async () => {
        // Set up the sensor and its hierarchy
        const sensor = new SensorDAO();
        sensor.sensorMac = "33:33:33:33:33:33";
        sensor.sensorName = "Sensor Name 1";
        sensor.sensorDescription = "Sensor Description 1";
        sensor.sensorVariable = "Temperature";
        sensor.sensorUnit = "Celsius";

        sensor.gateway = new GatewayDAO();
        sensor.gateway.gatewayMac = "11:11:11:11:11:11";
        sensor.gateway.gatewayName = "Gateway Name 1";
        sensor.gateway.gatewayDescription = "G Description 1";

        sensor.gateway.network = new NetworkDAO();
        sensor.gateway.network.networkCode = "networkCode1";
        sensor.gateway.network.networkName = "Network Name";
        sensor.gateway.network.networkDescription = "Description 1";

        // Measurements
        const measurement1 = new MeasurementDAO();
        measurement1.createdAt = new Date("2025-05-01T10:00:00Z");
        measurement1.value = 25.5;
        measurement1.sensor = sensor;

        const measurement2 = new MeasurementDAO();
        measurement2.createdAt = new Date("2025-05-01T11:00:00Z");
        measurement2.value = 26.0;
        measurement2.sensor = sensor;

        const mockMeasurements = [measurement1, measurement2];
        mockFind.mockResolvedValue(mockMeasurements);

        //mock sensor repo findOne to return the sensor
        const mockSensorFindOne = (AppDataSource.getRepository(SensorDAO).findOne as jest.Mock);
        mockSensorFindOne.mockResolvedValue(sensor);

        (repo as any).MeasurementRepo = {
            find: mockFind,
        };

        // Call the method with just startDate
        const startDate = new Date("2025-05-01T00:00:00Z");
        const result = await repo.getMeasurementsBySensor("networkCode1", "11:11:11:11:11:11", "33:33:33:33:33:33", startDate);

        expect(result).toBeDefined();
        expect(result.length).toBe(2);
        expect(result[0].value).toBe(25.5);
        expect(result[1].value).toBe(26.0);
        expect(result[0].sensor.sensorMac).toBe("33:33:33:33:33:33");
        expect(result[1].sensor.sensorMac).toBe("33:33:33:33:33:33");
        


        //now just endDate
        const endDate = new Date("2025-05-01T23:59:59Z");

        const result2 = await repo.getMeasurementsBySensor("networkCode1", "11:11:11:11:11:11", "33:33:33:33:33:33", undefined, endDate);
        expect(result2).toBeDefined();
        expect(result2.length).toBe(2);
        expect(result2[0].value).toBe(25.5);
        expect(result2[1].value).toBe(26.0);
        expect(result2[0].sensor.sensorMac).toBe("33:33:33:33:33:33");
        expect(result2[1].sensor.sensorMac).toBe("33:33:33:33:33:33");

    
    });


    it("getMeasurementsByNetworkAndSensors without optional fields", async () => {
        // Sensor & network hierarchy
        const sensor = new SensorDAO();
        sensor.sensorMac = "33:33:33:33:33:33";
        sensor.sensorName = "Sensor Name 1";
        sensor.sensorVariable = "Temperature";
        sensor.sensorUnit = "Celsius";
    
        sensor.gateway = new GatewayDAO();
        sensor.gateway.gatewayMac = "11:11:11:11:11:11";
        sensor.gateway.gatewayName = "Gateway Name 1";
        sensor.gateway.gatewayDescription = "G Description 1";
    
        sensor.gateway.network = new NetworkDAO();
        sensor.gateway.network.networkCode = "networkCode1";
        sensor.gateway.network.networkName = "Network Name";
        sensor.gateway.network.networkDescription = "Description 1";
    
        // Measurements
        const measurement1 = new MeasurementDAO();
        measurement1.createdAt = new Date("2025-05-05T10:00:00Z");
        measurement1.value = 22.0;
        measurement1.sensor = sensor;
    
        const measurement2 = new MeasurementDAO();
        measurement2.createdAt = new Date("2025-05-05T12:00:00Z");
        measurement2.value = 23.5;
        measurement2.sensor = sensor;
    
        const mockMeasurements = [measurement1, measurement2];
    
        mockFind.mockResolvedValue(mockMeasurements);

        (repo as any).MeasurementRepo = {
            find: mockFind,
        };

    
        const result = await repo.getMeasurementsByNetworkAndSensors("networkCode1");
    
        expect(result).toBeDefined();
        expect(result.length).toBe(2);
        expect(result[0].value).toBe(22.0);
        expect(result[1].value).toBe(23.5);
        expect(result[0].sensor.sensorMac).toBe("33:33:33:33:33:33");
    
        // Verify correct query construction
        expect(mockFind).toHaveBeenCalledWith({
            where: {
                sensor: {
                    gateway: {
                        network: {
                            networkCode: "networkCode1",
                        },
                    },
                },
            },
            relations: ["sensor"] //just sensor is eagerly loaded
        });
    });
     
    it("getMeasurementsByNetworkAndSensors with all optional fields", async () => {
        // Sensor & network hierarchy
        const sensor = new SensorDAO();
        sensor.sensorMac = "33:33:33:33:33:33";
        sensor.sensorName = "Sensor Name 1";
        sensor.sensorVariable = "Temperature";
        sensor.sensorUnit = "Celsius";
    
        sensor.gateway = new GatewayDAO();
        sensor.gateway.gatewayMac = "11:11:11:11:11:11";
        sensor.gateway.gatewayName = "Gateway Name 1";
        sensor.gateway.gatewayDescription = "G Description 1";
    
        sensor.gateway.network = new NetworkDAO();
        sensor.gateway.network.networkCode = "networkCode1";
        sensor.gateway.network.networkName = "Network Name";
        sensor.gateway.network.networkDescription = "Description 1";
    
        // Measurements
        const measurement1 = new MeasurementDAO();
        measurement1.createdAt = new Date("2025-05-05T10:00:00Z");
        measurement1.value = 22.0;
        measurement1.sensor = sensor;
    
        const measurement2 = new MeasurementDAO();
        measurement2.createdAt = new Date("2025-05-05T12:00:00Z");
        measurement2.value = 23.5;
        measurement2.sensor = sensor;
    
        const mockMeasurements = [measurement1, measurement2];
    
       mockFind.mockResolvedValue(mockMeasurements);

        (repo as any).MeasurementRepo = {
            find: mockFind,
        };
    
        const startDate = new Date("2025-05-01T00:00:00Z");
        const endDate = new Date("2025-05-10T00:00:00Z");
    
        const result = await repo.getMeasurementsByNetworkAndSensors("networkCode1", ["33:33:33:33:33:33"], startDate, endDate);
    
        expect(result).toBeDefined();
        expect(result.length).toBe(2);
        expect(result[0].value).toBe(22.0);
        expect(result[1].value).toBe(23.5);
        expect(result[0].sensor.sensorMac).toBe("33:33:33:33:33:33");
    
        // Verify correct query construction
        expect(mockFind).toHaveBeenCalledWith({
        where: {
            sensor: {
                sensorMac: In(["33:33:33:33:33:33"]),
                gateway: {
                    network: {
                        networkCode: "networkCode1",
                    },
                },
            },
            createdAt: Between(startDate, endDate),
        },
        relations: ["sensor"] //just sensor is eagerly loaded
    });
    });
    
    it("getMeasurementsByNetworkAndSensors: wrong networkCode - throws EntityNotFoundError", async () => {
        //mock network repo find on to return an empty array
        const mockNetworkFindOne = (AppDataSource.getRepository(NetworkDAO).findOne as jest.Mock);
        mockNetworkFindOne.mockResolvedValue(undefined); // Simula nessun risultato
    
        const networkCode = "networkCode1";
    
        await expect(repo.getMeasurementsByNetworkAndSensors(networkCode)).rejects.toThrow(NotFoundError);
    
    });

    it("getMeasurementsByNetworkAndSensors: wrong sensorMac - throws EntityNotFoundError", async () => {

        // Simulate an existing network
        const existingNetwork = new NetworkDAO();
        existingNetwork.networkCode = "networkCode1";
        existingNetwork.networkName = "Network Name";
        existingNetwork.networkDescription = "Description 1";
        const mockNetworkFindOne = (AppDataSource.getRepository(NetworkDAO).findOne as jest.Mock);
        mockNetworkFindOne.mockResolvedValue(existingNetwork);

        //the find will return an empty array
        mockFind.mockResolvedValue([]);

        await expect(repo.getMeasurementsByNetworkAndSensors("networkCode1", ["wrongSensorMac"])).resolves.toEqual([]);

    });

    it("getMeasurementsByNetworkAndSensors: tests dates", async () => {

        //Network is ok
        const existingNetwork = new NetworkDAO();
        existingNetwork.networkCode = "networkCode1";
        existingNetwork.networkName = "Network Name";
        existingNetwork.networkDescription = "Description 1";
        const mockNetworkFindOne = (AppDataSource.getRepository(NetworkDAO).findOne as jest.Mock);
        mockNetworkFindOne.mockResolvedValue(existingNetwork);

        //Sensor is ok
        const existingSensor = new SensorDAO();
        existingSensor.sensorMac = "33:33:33:33:33:33";
        existingSensor.sensorName = "Sensor Name 1";
        existingSensor.sensorDescription = "Sensor Description 1";
        existingSensor.sensorVariable = "Temperature";
        existingSensor.sensorUnit = "Celsius";

        const mockSensorFindOne = (AppDataSource.getRepository(SensorDAO).findOne as jest.Mock);
        mockSensorFindOne.mockResolvedValue(existingSensor);

        //Measurements
        const measurement1 = new MeasurementDAO();
        measurement1.createdAt = new Date("2025-05-05T10:00:00Z");
        measurement1.value = 22.0;
        measurement1.sensor = existingSensor;

        const measurement2 = new MeasurementDAO();
        measurement2.createdAt = new Date("2025-05-05T12:00:00Z");
        measurement2.value = 23.5;
        measurement2.sensor = existingSensor;

        const mockMeasurements = [measurement1, measurement2];

        mockFind.mockResolvedValue(mockMeasurements);

        (repo as any).MeasurementRepo = {
            find: mockFind,
        };

        const startDate = new Date("2025-05-01T00:00:00Z");
        const endDate = new Date("2025-05-10T00:00:00Z");

        const result = await repo.getMeasurementsByNetworkAndSensors("networkCode1", ["33:33:33:33:33:33"], startDate, endDate);

        expect(result).toBeDefined();
        expect(result.length).toBe(2);
        expect(result[0].value).toBe(22.0);
        expect(result[1].value).toBe(23.5);
        expect(result[0].sensor.sensorMac).toBe("33:33:33:33:33:33");

    });

    it("getMeasurementsByNetworkAndSensors - just one date", async () => {
        //Network is ok
        const existingNetwork = new NetworkDAO();
        existingNetwork.networkCode = "networkCode1";
        existingNetwork.networkName = "Network Name";
        existingNetwork.networkDescription = "Description 1";
        const mockNetworkFindOne = (AppDataSource.getRepository(NetworkDAO).findOne as jest.Mock);
        mockNetworkFindOne.mockResolvedValue(existingNetwork);

        //Sensor is ok
        const existingSensor = new SensorDAO();
        existingSensor.sensorMac = "33:33:33:33:33:33";
        existingSensor.sensorName = "Sensor Name 1";
        existingSensor.sensorDescription = "Sensor Description 1";
        existingSensor.sensorVariable = "Temperature";
        existingSensor.sensorUnit = "Celsius";

        const mockSensorFindOne = (AppDataSource.getRepository(SensorDAO).findOne as jest.Mock);
        mockSensorFindOne.mockResolvedValue(existingSensor);

        //Measurements
        const measurement1 = new MeasurementDAO();
        measurement1.createdAt = new Date("2025-05-05T10:00:00Z");
        measurement1.value = 22.0;
        measurement1.sensor = existingSensor;

        const measurement2 = new MeasurementDAO();
        measurement2.createdAt = new Date("2025-05-05T12:00:00Z");
        measurement2.value = 23.5;
        measurement2.sensor = existingSensor;

        const mockMeasurements = [measurement1, measurement2];

        mockFind.mockResolvedValue(mockMeasurements);

        (repo as any).MeasurementRepo = {
            find: mockFind,
        };

        const startDate = new Date("2025-05-01T00:00:00Z");
        //no endDate

        const result = await repo.getMeasurementsByNetworkAndSensors("networkCode1", ["33:33:33:33:33:33"], startDate);

        expect(result).toBeDefined();
        expect(result.length).toBe(2);
        expect(result[0].value).toBe(22.0);
        expect(result[1].value).toBe(23.5);
        expect(result[0].sensor.sensorMac).toBe("33:33:33:33:33:33");

        //now just endDate
        const endDate = new Date("2026-05-10T00:00:00Z");
        const result2 = await repo.getMeasurementsByNetworkAndSensors("networkCode1", ["33:33:33:33:33:33"], undefined, endDate);
        expect(result2).toBeDefined();
        expect(result2.length).toBe(2);
        expect(result2[0].value).toBe(22.0);
        expect(result2[1].value).toBe(23.5);
        expect(result2[0].sensor.sensorMac).toBe("33:33:33:33:33:33");
    });

});