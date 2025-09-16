import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { NetworkDAO } from "@dao/NetworkDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import { mock } from "node:test";
import { UpdateResult, DeleteResult } from "typeorm";


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



describe("SensorRepository: mocked database", () => {

    const repo = new SensorRepository();

    beforeEach(() => {
        jest.clearAllMocks();
    });


    it("create sensor", async () => {
        //Mock the find method to return an empty array, no conflict with sensor to be created
        mockFind.mockResolvedValue([]);

        const savedSensor = new SensorDAO();
        //"networkCode", "gatewayMac", "macAddress", "sensorName", "sensorDescription", "variableType", "unit"

        savedSensor.sensorMac = "11:11:11:11:11:11";
        savedSensor.sensorName = "Sensor Name";
        savedSensor.sensorDescription = "Sensor Description";
        savedSensor.sensorVariable = "Temperature";
        savedSensor.sensorUnit = "Celsius";
        savedSensor.gateway = new GatewayDAO();
        savedSensor.gateway.gatewayMac = "22:22:22:22:22:22";
        savedSensor.gateway.gatewayName = "Gateway Name";
        savedSensor.gateway.gatewayDescription = "G Description 1";

        //Mock the save method to return the saved gateway
        mockSave.mockResolvedValue(savedSensor);

        const mockGateway = new GatewayDAO();
        mockGateway.gatewayMac = "22:22:22:22:22:22";
        mockGateway.gatewayName = "Gateway Name";
        mockGateway.gatewayDescription = "G Description 1";
        mockGateway.network = new NetworkDAO();
        mockGateway.network.networkCode = "networkCode1";

        mockFindOne.mockResolvedValue(mockGateway);
        

        const savedSensorReal = await repo.createSensor("networkCode1", "22:22:22:22:22:22", "11:11:11:11:11:11", "Sensor Name", "Sensor Description", "Temperature", "Celsius");

        //Now check that the saved sensor is the same as the one we created
        expect(savedSensorReal).toBeDefined();
        expect(savedSensorReal).toBeInstanceOf(SensorDAO);
        //check params
        expect(savedSensorReal.sensorMac).toBe("11:11:11:11:11:11");
        expect(savedSensorReal.sensorName).toBe("Sensor Name");
        expect(savedSensorReal.sensorDescription).toBe("Sensor Description");
        expect(savedSensorReal.sensorVariable).toBe("Temperature");
        expect(savedSensorReal.sensorUnit).toBe("Celsius");

        expect(savedSensorReal.gateway).toBeDefined();
        expect(savedSensorReal.gateway).toBeInstanceOf(GatewayDAO);
        expect(savedSensorReal.gateway.gatewayMac).toBe("22:22:22:22:22:22");
        expect(savedSensorReal.gateway.gatewayName).toBe("Gateway Name");
        expect(savedSensorReal.gateway.gatewayDescription).toBe("G Description 1");
        

        //Check that the mockSave has been called with the correct parameters
        expect(mockSave).toHaveBeenCalledWith({
            sensorMac: "11:11:11:11:11:11",
            sensorName: "Sensor Name",
            sensorDescription: "Sensor Description",
            sensorVariable: "Temperature",
            sensorUnit: "Celsius",
            gateway: mockGateway
        });

    });

    it("create sensor with existing sensorMac - ConflictError thrown", async () => {

        //Now simulate a sensor with the same sensorMac already in the database
        const alreadyPresentSensor = new SensorDAO();
        alreadyPresentSensor.sensorMac = "11:11:11:11:11:11";
        alreadyPresentSensor.sensorName = "Sensor Name";
        alreadyPresentSensor.sensorDescription = "Sensor Description";
        alreadyPresentSensor.sensorVariable = "Temperature";
        alreadyPresentSensor.sensorUnit = "Celsius";
        alreadyPresentSensor.gateway = new GatewayDAO();
        alreadyPresentSensor.gateway.gatewayMac = "22:22:22:22:22:22";
        alreadyPresentSensor.gateway.gatewayName = "Gateway Name";
        alreadyPresentSensor.gateway.gatewayDescription = "G Description 1";

        mockFind.mockResolvedValue([alreadyPresentSensor]);


        //Now try to create a new sensor inserting the same sensorMac
        //A ConflictError should be thrown

        await expect(repo.createSensor("networkCode1", "22:22:22:22:22:22", "11:11:11:11:11:11", "Sensor Name", "Sensor Description", "Temperature", "Celsius")).rejects.toThrow(ConflictError);


    });

    it("create sensor without existing networkCode - NotFoundError thrown", async () => {

        //Mock the find method to return an empty array, no conflict with sensor to be created
        mockFind.mockResolvedValue([]);

        //Now simulate a net with the same networkCode not present in the database
        mockFindOne.mockResolvedValue(undefined)

        //Now try to create a new sensor inserting a networkCode not present in the database
        //A NotFoundError should be thrown

        await expect(repo.createSensor("ghost", "22:22:22:22:22:22", "11:11:11:11:11:11", "Sensor Name", "Sensor Description", "Temperature", "Celsius")).rejects.toThrow(NotFoundError);

    });

    it("create sensor without existing gatewayMac - NotFoundError thrown", async () => {

        //Mock the find method to return an empty array, no conflict with sensor to be created
        mockFind.mockResolvedValue([]);

        //Now simulate a gateway with the same gatewayMac not present in the database
        mockFindOne.mockResolvedValue(undefined)

        //Now try to create a new sensor inserting a networkCode not present in the database
        //A NotFoundError should be thrown

        await expect(repo.createSensor("networkCode1", "non-existent-mac", "11:11:11:11:11:11", "Sensor Name", "Sensor Description", "Temperature", "Celsius")).rejects.toThrow(NotFoundError);

    });

    it("get all sensors", async () => {

        // Simulate an existing network
        const existingNet = new NetworkDAO();
        existingNet.networkCode = "networkCode1";
        existingNet.networkName = "Network Name";
        existingNet.networkDescription = "Description 1";

        // Simulate two gateways linked to that network
        const gateway1 = new GatewayDAO();
        gateway1.gatewayMac = "11:11:11:11:11:11";
        gateway1.gatewayName = "Gateway Name 1";
        gateway1.gatewayDescription = "G Description 1";
        gateway1.network = existingNet;

        const gateway2 = new GatewayDAO();
        gateway2.gatewayMac = "22:22:22:22:22:22";
        gateway2.gatewayName = "Gateway Name 2";
        gateway2.gatewayDescription = "G Description 2";
        gateway2.network = existingNet;

        // Simulate two sensors linked to the first gateway
        const sensor1 = new SensorDAO();
        sensor1.sensorMac = "33:33:33:33:33:33";
        sensor1.sensorName = "Sensor Name 1";
        sensor1.sensorDescription = "Sensor Description 1";
        sensor1.sensorVariable = "Temperature";
        sensor1.sensorUnit = "Celsius";
        sensor1.gateway = gateway1;

        const sensor2 = new SensorDAO();
        sensor2.sensorMac = "44:44:44:44:44:44";
        sensor2.sensorName = "Sensor Name 2";
        sensor2.sensorDescription = "Sensor Description 2";
        sensor2.sensorVariable = "Humidity";
        sensor2.sensorUnit = "Percentage";
        sensor2.gateway = gateway1;

        const findRes = [sensor1, sensor2];

        mockFind.mockResolvedValue(findRes);


        const allSensorsReal = await repo.getAllSensors(true);
        //check they correspond to the ones we created before
        expect(allSensorsReal).toBeDefined();
        expect(allSensorsReal.length).toBe(2);
        expect(allSensorsReal[0].sensorMac).toBe("33:33:33:33:33:33");
        expect(allSensorsReal[0].sensorName).toBe("Sensor Name 1");
        expect(allSensorsReal[0].sensorDescription).toBe("Sensor Description 1");
        expect(allSensorsReal[0].sensorVariable).toBe("Temperature");
        expect(allSensorsReal[0].sensorUnit).toBe("Celsius");

        expect(allSensorsReal[0].gateway).toBeDefined();
        expect(allSensorsReal[0].gateway).toBeInstanceOf(GatewayDAO);
        expect(allSensorsReal[0].gateway.gatewayMac).toBe("11:11:11:11:11:11");
        expect(allSensorsReal[0].gateway.gatewayName).toBe("Gateway Name 1");
        expect(allSensorsReal[0].gateway.gatewayDescription).toBe("G Description 1");

        expect(allSensorsReal[0].gateway.network).toBeDefined();
        expect(allSensorsReal[0].gateway.network).toBeInstanceOf(NetworkDAO);
        expect(allSensorsReal[0].gateway.network.networkCode).toBe("networkCode1");
        expect(allSensorsReal[0].gateway.network.networkName).toBe("Network Name");
        expect(allSensorsReal[0].gateway.network.networkDescription).toBe("Description 1");

        expect(allSensorsReal[1].sensorMac).toBe("44:44:44:44:44:44");
        expect(allSensorsReal[1].sensorName).toBe("Sensor Name 2");
        expect(allSensorsReal[1].sensorDescription).toBe("Sensor Description 2");
        expect(allSensorsReal[1].sensorVariable).toBe("Humidity");
        expect(allSensorsReal[1].sensorUnit).toBe("Percentage");

        expect(allSensorsReal[1].gateway).toBeDefined();
        expect(allSensorsReal[1].gateway).toBeInstanceOf(GatewayDAO);
        expect(allSensorsReal[1].gateway.gatewayMac).toBe("11:11:11:11:11:11");
        expect(allSensorsReal[1].gateway.gatewayName).toBe("Gateway Name 1");
        expect(allSensorsReal[1].gateway.gatewayDescription).toBe("G Description 1");

        expect(allSensorsReal[1].gateway.network).toBeDefined();
        expect(allSensorsReal[1].gateway.network).toBeInstanceOf(NetworkDAO);
        expect(allSensorsReal[1].gateway.network.networkCode).toBe("networkCode1");
        expect(allSensorsReal[1].gateway.network.networkName).toBe("Network Name");
        expect(allSensorsReal[1].gateway.network.networkDescription).toBe("Description 1");
        expect(mockFind).toHaveBeenCalledWith({
            relations: ["gateway"]
        });

    });

    it("get all sensors - without loading gateway", async () => {

        // Simulate an existing network
        const existingNet = new NetworkDAO();
        existingNet.networkCode = "networkCode1";
        existingNet.networkName = "Network Name";
        existingNet.networkDescription = "Description 1";

        // Simulate two gateways linked to that network
        const gateway1 = new GatewayDAO();
        gateway1.gatewayMac = "11:11:11:11:11:11";
        gateway1.gatewayName = "Gateway Name 1";
        gateway1.gatewayDescription = "G Description 1";
        gateway1.network = existingNet;

        const gateway2 = new GatewayDAO();
        gateway2.gatewayMac = "22:22:22:22:22:22";
        gateway2.gatewayName = "Gateway Name 2";
        gateway2.gatewayDescription = "G Description 2";
        gateway2.network = existingNet;

        // Simulate two sensors linked to the first gateway
        const sensor1 = new SensorDAO();
        sensor1.sensorMac = "33:33:33:33:33:33";
        sensor1.sensorName = "Sensor Name 1";
        sensor1.sensorDescription = "Sensor Description 1";
        sensor1.sensorVariable = "Temperature";
        sensor1.sensorUnit = "Celsius";
        sensor1.gateway = gateway1;

        const sensor2 = new SensorDAO();
        sensor2.sensorMac = "44:44:44:44:44:44";
        sensor2.sensorName = "Sensor Name 2";
        sensor2.sensorDescription = "Sensor Description 2";
        sensor2.sensorVariable = "Humidity";
        sensor2.sensorUnit = "Percentage";
        sensor2.gateway = gateway1;

        const findRes = [sensor1, sensor2];

        mockFind.mockResolvedValue(findRes);


        const allSensorsReal = await repo.getAllSensors(false);
        //check they correspond to the ones we created before
        expect(allSensorsReal).toBeDefined();
        expect(allSensorsReal.length).toBe(2);
        expect(allSensorsReal[0].sensorMac).toBe("33:33:33:33:33:33");
        expect(allSensorsReal[0].sensorName).toBe("Sensor Name 1");
        expect(allSensorsReal[0].sensorDescription).toBe("Sensor Description 1");
        expect(allSensorsReal[0].sensorVariable).toBe("Temperature");
        expect(allSensorsReal[0].sensorUnit).toBe("Celsius");

        expect(allSensorsReal[0].gateway).toBeDefined();
        expect(allSensorsReal[0].gateway).toBeInstanceOf(GatewayDAO);
        expect(allSensorsReal[0].gateway.gatewayMac).toBe("11:11:11:11:11:11");
        expect(allSensorsReal[0].gateway.gatewayName).toBe("Gateway Name 1");
        expect(allSensorsReal[0].gateway.gatewayDescription).toBe("G Description 1");

        expect(allSensorsReal[0].gateway.network).toBeDefined();
        expect(allSensorsReal[0].gateway.network).toBeInstanceOf(NetworkDAO);
        expect(allSensorsReal[0].gateway.network.networkCode).toBe("networkCode1");
        expect(allSensorsReal[0].gateway.network.networkName).toBe("Network Name");
        expect(allSensorsReal[0].gateway.network.networkDescription).toBe("Description 1");

        expect(allSensorsReal[1].sensorMac).toBe("44:44:44:44:44:44");
        expect(allSensorsReal[1].sensorName).toBe("Sensor Name 2");
        expect(allSensorsReal[1].sensorDescription).toBe("Sensor Description 2");
        expect(allSensorsReal[1].sensorVariable).toBe("Humidity");
        expect(allSensorsReal[1].sensorUnit).toBe("Percentage");

        expect(allSensorsReal[1].gateway).toBeDefined();
        expect(allSensorsReal[1].gateway).toBeInstanceOf(GatewayDAO);
        expect(allSensorsReal[1].gateway.gatewayMac).toBe("11:11:11:11:11:11");
        expect(allSensorsReal[1].gateway.gatewayName).toBe("Gateway Name 1");
        expect(allSensorsReal[1].gateway.gatewayDescription).toBe("G Description 1");

        expect(allSensorsReal[1].gateway.network).toBeDefined();
        expect(allSensorsReal[1].gateway.network).toBeInstanceOf(NetworkDAO);
        expect(allSensorsReal[1].gateway.network.networkCode).toBe("networkCode1");
        expect(allSensorsReal[1].gateway.network.networkName).toBe("Network Name");
        expect(allSensorsReal[1].gateway.network.networkDescription).toBe("Description 1");
        expect(mockFind).toHaveBeenCalledWith({
            relations: []
        });

    });

    it("get all sensors: empty list", async () => {
        //suppose there are no sensors in the db
        //the find method should return an empty array
        mockFind.mockResolvedValue([]);


        const allSensorsReal = await repo.getAllSensors();
        //check they correspond to the ones we created before
        expect(allSensorsReal).toBeDefined();
        expect(allSensorsReal.length).toBe(0);
        expect(allSensorsReal).toEqual([]);

    });

    it("get sensors by network code and gateway mac", async () => {

        // Simulate an existing network
        const existingNet = new NetworkDAO();
        existingNet.networkCode = "networkCode1";
        existingNet.networkName = "Network Name";
        existingNet.networkDescription = "Description 1";

        // Simulate two gateways linked to that network
        const gateway1 = new GatewayDAO();
        gateway1.gatewayMac = "11:11:11:11:11:11";
        gateway1.gatewayName = "Gateway Name 1";
        gateway1.gatewayDescription = "G Description 1";
        gateway1.network = existingNet;

        const gateway2 = new GatewayDAO();
        gateway2.gatewayMac = "22:22:22:22:22:22";
        gateway2.gatewayName = "Gateway Name 2";
        gateway2.gatewayDescription = "G Description 2";
        gateway2.network = existingNet;

        // Simulate two sensors linked to the first gateway
        const sensor1 = new SensorDAO();
        sensor1.sensorMac = "33:33:33:33:33:33";
        sensor1.sensorName = "Sensor Name 1";
        sensor1.sensorDescription = "Sensor Description 1";
        sensor1.sensorVariable = "Temperature";
        sensor1.sensorUnit = "Celsius";
        sensor1.gateway = gateway1;

        const sensor2 = new SensorDAO();
        sensor2.sensorMac = "44:44:44:44:44:44";
        sensor2.sensorName = "Sensor Name 2";
        sensor2.sensorDescription = "Sensor Description 2";
        sensor2.sensorVariable = "Humidity";
        sensor2.sensorUnit = "Percentage";
        sensor2.gateway = gateway1;

        const findRes = [sensor1, sensor2];

        mockFind.mockResolvedValue(findRes);

        // Mock: findOne
        mockFindOne.mockResolvedValue(gateway1);

        const allSensorsReal = await repo.getAllSensorsByNetworkCodeGatewayMac("networkCode1", "11:11:11:11:11:11", true);

        //check they correspond to the ones we created before
        expect(allSensorsReal).toBeDefined();
        expect(allSensorsReal.length).toBe(2);
        expect(allSensorsReal[0].sensorMac).toBe("33:33:33:33:33:33");
        expect(allSensorsReal[0].sensorName).toBe("Sensor Name 1");
        expect(allSensorsReal[0].sensorDescription).toBe("Sensor Description 1");
        expect(allSensorsReal[0].sensorVariable).toBe("Temperature");
        expect(allSensorsReal[0].sensorUnit).toBe("Celsius");

        expect(allSensorsReal[0].gateway).toBeDefined();
        expect(allSensorsReal[0].gateway).toBeInstanceOf(GatewayDAO);
        expect(allSensorsReal[0].gateway.gatewayMac).toBe("11:11:11:11:11:11");
        expect(allSensorsReal[0].gateway.gatewayName).toBe("Gateway Name 1");
        expect(allSensorsReal[0].gateway.gatewayDescription).toBe("G Description 1");

        expect(allSensorsReal[0].gateway.network).toBeDefined();
        expect(allSensorsReal[0].gateway.network).toBeInstanceOf(NetworkDAO);
        expect(allSensorsReal[0].gateway.network.networkCode).toBe("networkCode1");
        expect(allSensorsReal[0].gateway.network.networkName).toBe("Network Name");
        expect(allSensorsReal[0].gateway.network.networkDescription).toBe("Description 1");

        expect(allSensorsReal[1].sensorMac).toBe("44:44:44:44:44:44");
        expect(allSensorsReal[1].sensorName).toBe("Sensor Name 2");
        expect(allSensorsReal[1].sensorDescription).toBe("Sensor Description 2");
        expect(allSensorsReal[1].sensorVariable).toBe("Humidity");
        expect(allSensorsReal[1].sensorUnit).toBe("Percentage");

        expect(allSensorsReal[1].gateway).toBeDefined();
        expect(allSensorsReal[1].gateway).toBeInstanceOf(GatewayDAO);
        expect(allSensorsReal[1].gateway.gatewayMac).toBe("11:11:11:11:11:11");
        expect(allSensorsReal[1].gateway.gatewayName).toBe("Gateway Name 1");
        expect(allSensorsReal[1].gateway.gatewayDescription).toBe("G Description 1");

        expect(allSensorsReal[1].gateway.network).toBeDefined();
        expect(allSensorsReal[1].gateway.network).toBeInstanceOf(NetworkDAO);
        expect(allSensorsReal[1].gateway.network.networkCode).toBe("networkCode1");
        expect(allSensorsReal[1].gateway.network.networkName).toBe("Network Name");
        expect(allSensorsReal[1].gateway.network.networkDescription).toBe("Description 1");
        expect(mockFind).toHaveBeenCalledWith({
            where: {
                gateway: {
                  gatewayMac: "11:11:11:11:11:11",
                  network: { networkCode: "networkCode1" }
                }
              },
              relations: ["gateway"]
        });
    });

    it("get sensors by network code and gateway mac - uses default loadGateway=false", async () => {

        // Simulate an existing network
        const existingNet = new NetworkDAO();
        existingNet.networkCode = "networkCode1";
        existingNet.networkName = "Network Name";
        existingNet.networkDescription = "Description 1";

        // Simulate two gateways linked to that network
        const gateway1 = new GatewayDAO();
        gateway1.gatewayMac = "11:11:11:11:11:11";
        gateway1.gatewayName = "Gateway Name 1";
        gateway1.gatewayDescription = "G Description 1";
        gateway1.network = existingNet;

        const gateway2 = new GatewayDAO();
        gateway2.gatewayMac = "22:22:22:22:22:22";
        gateway2.gatewayName = "Gateway Name 2";
        gateway2.gatewayDescription = "G Description 2";
        gateway2.network = existingNet;

        // Simulate two sensors linked to the first gateway
        const sensor1 = new SensorDAO();
        sensor1.sensorMac = "33:33:33:33:33:33";
        sensor1.sensorName = "Sensor Name 1";
        sensor1.sensorDescription = "Sensor Description 1";
        sensor1.sensorVariable = "Temperature";
        sensor1.sensorUnit = "Celsius";
        sensor1.gateway = gateway1;

        const sensor2 = new SensorDAO();
        sensor2.sensorMac = "44:44:44:44:44:44";
        sensor2.sensorName = "Sensor Name 2";
        sensor2.sensorDescription = "Sensor Description 2";
        sensor2.sensorVariable = "Humidity";
        sensor2.sensorUnit = "Percentage";
        sensor2.gateway = gateway1;

        const findRes = [sensor1, sensor2];

        mockFind.mockResolvedValue(findRes);

        // Mock: findOne
        mockFindOne.mockResolvedValue(gateway1);

        const allSensorsReal = await repo.getAllSensorsByNetworkCodeGatewayMac("networkCode1", "11:11:11:11:11:11");

        //check they correspond to the ones we created before
        expect(allSensorsReal).toBeDefined();
        expect(allSensorsReal.length).toBe(2);
        expect(allSensorsReal[0].sensorMac).toBe("33:33:33:33:33:33");
        expect(allSensorsReal[0].sensorName).toBe("Sensor Name 1");
        expect(allSensorsReal[0].sensorDescription).toBe("Sensor Description 1");
        expect(allSensorsReal[0].sensorVariable).toBe("Temperature");
        expect(allSensorsReal[0].sensorUnit).toBe("Celsius");

        expect(allSensorsReal[0].gateway).toBeDefined();
        expect(allSensorsReal[0].gateway).toBeInstanceOf(GatewayDAO);
        expect(allSensorsReal[0].gateway.gatewayMac).toBe("11:11:11:11:11:11");
        expect(allSensorsReal[0].gateway.gatewayName).toBe("Gateway Name 1");
        expect(allSensorsReal[0].gateway.gatewayDescription).toBe("G Description 1");

        expect(allSensorsReal[0].gateway.network).toBeDefined();
        expect(allSensorsReal[0].gateway.network).toBeInstanceOf(NetworkDAO);
        expect(allSensorsReal[0].gateway.network.networkCode).toBe("networkCode1");
        expect(allSensorsReal[0].gateway.network.networkName).toBe("Network Name");
        expect(allSensorsReal[0].gateway.network.networkDescription).toBe("Description 1");

        expect(allSensorsReal[1].sensorMac).toBe("44:44:44:44:44:44");
        expect(allSensorsReal[1].sensorName).toBe("Sensor Name 2");
        expect(allSensorsReal[1].sensorDescription).toBe("Sensor Description 2");
        expect(allSensorsReal[1].sensorVariable).toBe("Humidity");
        expect(allSensorsReal[1].sensorUnit).toBe("Percentage");

        expect(allSensorsReal[1].gateway).toBeDefined();
        expect(allSensorsReal[1].gateway).toBeInstanceOf(GatewayDAO);
        expect(allSensorsReal[1].gateway.gatewayMac).toBe("11:11:11:11:11:11");
        expect(allSensorsReal[1].gateway.gatewayName).toBe("Gateway Name 1");
        expect(allSensorsReal[1].gateway.gatewayDescription).toBe("G Description 1");

        expect(allSensorsReal[1].gateway.network).toBeDefined();
        expect(allSensorsReal[1].gateway.network).toBeInstanceOf(NetworkDAO);
        expect(allSensorsReal[1].gateway.network.networkCode).toBe("networkCode1");
        expect(allSensorsReal[1].gateway.network.networkName).toBe("Network Name");
        expect(allSensorsReal[1].gateway.network.networkDescription).toBe("Description 1");
        expect(mockFind).toHaveBeenCalledWith({
            where: {
                gateway: {
                  gatewayMac: "11:11:11:11:11:11",
                  network: { networkCode: "networkCode1" }
                }
              },
              relations: []
        });
    });

    it("get sensors by non-existing network code and existing gateway mac - NotFoundError thrown", async () => {

        // Simulate a net with a non-existing networkCode
        mockFindOne.mockResolvedValue(undefined);

        //Now try to get a sensor inserting a networkCode not present in the database
        //A NotFoundError should be thrown
        await expect(repo.getAllSensorsByNetworkCodeGatewayMac("ghost", "11:11:11:11:11:11", true)).rejects.toThrow(NotFoundError);
        
        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                gatewayMac: "11:11:11:11:11:11",
                network: { networkCode: "ghost" }
            }
        });
        
    });

    it("get sensors by existing network code but non-existing gateway mac - NotFoundError thrown", async () => {

        // Simulate a net with a non-existing networkCode
        mockFindOne.mockResolvedValue(undefined);

        //Now try to get a sensor inserting a gatewayMac not present in the database
        //A NotFoundError should be thrown
        await expect(repo.getAllSensorsByNetworkCodeGatewayMac("networkCode1", "non-existent-mac", true)).rejects.toThrow(NotFoundError);
        
        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                gatewayMac: "non-existent-mac",
                network: { networkCode: "networkCode1" }
            }
        });
        
    });

    it("get sensors by network code and gateway mac: empty list", async () => {

        // Simulate an existing network
        const existingNet = new NetworkDAO();
        existingNet.networkCode = "networkCode1";
        existingNet.networkName = "Network Name";
        existingNet.networkDescription = "Description 1";

        // Simulate two gateways linked to that network
        const gateway1 = new GatewayDAO();
        gateway1.gatewayMac = "11:11:11:11:11:11";
        gateway1.gatewayName = "Gateway Name 1";
        gateway1.gatewayDescription = "G Description 1";
        gateway1.network = existingNet;

        const gateway2 = new GatewayDAO();
        gateway2.gatewayMac = "22:22:22:22:22:22";
        gateway2.gatewayName = "Gateway Name 2";
        gateway2.gatewayDescription = "G Description 2";
        gateway2.network = existingNet;

        const findRes = [];

        mockFind.mockResolvedValue(findRes);

        // Mock: findOne
        mockFindOne.mockResolvedValue(gateway1);

        const allSensorsReal = await repo.getAllSensorsByNetworkCodeGatewayMac("networkCode1", "11:11:11:11:11:11", true);

        //check they correspond to the ones we created before
        expect(allSensorsReal).toBeDefined();
        expect(allSensorsReal.length).toBe(0);
        expect(allSensorsReal).toEqual([]);

        expect(mockFind).toHaveBeenCalledWith({
            where: {
                gateway: {
                  gatewayMac: "11:11:11:11:11:11",
                  network: { networkCode: "networkCode1" }
                }
              },
              relations: ["gateway"]
        });
    });
    
    it("get sensor by network code and gateway mac and sensor mac", async () => {

        // Simulate an existing network
        const existingNet = new NetworkDAO();
        existingNet.networkCode = "networkCode1";
        existingNet.networkName = "Network Name";
        existingNet.networkDescription = "Description 1";

        // Simulate two gateways linked to that network
        const gateway1 = new GatewayDAO();
        gateway1.gatewayMac = "11:11:11:11:11:11";
        gateway1.gatewayName = "Gateway Name 1";
        gateway1.gatewayDescription = "G Description 1";
        gateway1.network = existingNet;

        const gateway2 = new GatewayDAO();
        gateway2.gatewayMac = "22:22:22:22:22:22";
        gateway2.gatewayName = "Gateway Name 2";
        gateway2.gatewayDescription = "G Description 2";
        gateway2.network = existingNet;

        // Simulate two sensors linked to the first gateway
        const sensor1 = new SensorDAO();
        sensor1.sensorMac = "33:33:33:33:33:33";
        sensor1.sensorName = "Sensor Name 1";
        sensor1.sensorDescription = "Sensor Description 1";
        sensor1.sensorVariable = "Temperature";
        sensor1.sensorUnit = "Celsius";
        sensor1.gateway = gateway1;

        const sensor2 = new SensorDAO();
        sensor2.sensorMac = "44:44:44:44:44:44";
        sensor2.sensorName = "Sensor Name 2";
        sensor2.sensorDescription = "Sensor Description 2";
        sensor2.sensorVariable = "Humidity";
        sensor2.sensorUnit = "Percentage";
        sensor2.gateway = gateway1;


        // Mock: findOne
        mockFindOne.mockResolvedValue(sensor1);

        const allSensorsReal = await repo.getSensorByNetworkCodeGatewayMacSensorMac("networkCode1", "11:11:11:11:11:11", "33:33:33:33:33:33", true);

        //check they correspond to the ones we created before
        expect(allSensorsReal).toBeDefined();
        expect(allSensorsReal).toBeInstanceOf(SensorDAO);
        expect(allSensorsReal.sensorMac).toBe("33:33:33:33:33:33");
        expect(allSensorsReal.sensorName).toBe("Sensor Name 1");
        expect(allSensorsReal.sensorDescription).toBe("Sensor Description 1");
        expect(allSensorsReal.sensorVariable).toBe("Temperature");
        expect(allSensorsReal.sensorUnit).toBe("Celsius");
        expect(allSensorsReal.gateway).toBeDefined();
        expect(allSensorsReal.gateway).toBeInstanceOf(GatewayDAO);
        expect(allSensorsReal.gateway.gatewayMac).toBe("11:11:11:11:11:11");
        expect(allSensorsReal.gateway.gatewayName).toBe("Gateway Name 1");
        expect(allSensorsReal.gateway.gatewayDescription).toBe("G Description 1");
        expect(allSensorsReal.gateway.network).toBeDefined();
        expect(allSensorsReal.gateway.network).toBeInstanceOf(NetworkDAO);
        expect(allSensorsReal.gateway.network.networkCode).toBe("networkCode1");
        expect(allSensorsReal.gateway.network.networkName).toBe("Network Name");
        expect(allSensorsReal.gateway.network.networkDescription).toBe("Description 1");
        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                sensorMac: "33:33:33:33:33:33",
                gateway: {
                    gatewayMac: "11:11:11:11:11:11",
                    network: { networkCode: "networkCode1" }
                }
            },
            relations: ["gateway"]
        });
    });

    it("get sensor by network code and gateway mac and sensor mac - uses default loadGateway=false", async () => {

        // Simulate an existing network
        const existingNet = new NetworkDAO();
        existingNet.networkCode = "networkCode1";
        existingNet.networkName = "Network Name";
        existingNet.networkDescription = "Description 1";

        // Simulate two gateways linked to that network
        const gateway1 = new GatewayDAO();
        gateway1.gatewayMac = "11:11:11:11:11:11";
        gateway1.gatewayName = "Gateway Name 1";
        gateway1.gatewayDescription = "G Description 1";
        gateway1.network = existingNet;

        const gateway2 = new GatewayDAO();
        gateway2.gatewayMac = "22:22:22:22:22:22";
        gateway2.gatewayName = "Gateway Name 2";
        gateway2.gatewayDescription = "G Description 2";
        gateway2.network = existingNet;

        // Simulate two sensors linked to the first gateway
        const sensor1 = new SensorDAO();
        sensor1.sensorMac = "33:33:33:33:33:33";
        sensor1.sensorName = "Sensor Name 1";
        sensor1.sensorDescription = "Sensor Description 1";
        sensor1.sensorVariable = "Temperature";
        sensor1.sensorUnit = "Celsius";
        sensor1.gateway = gateway1;

        const sensor2 = new SensorDAO();
        sensor2.sensorMac = "44:44:44:44:44:44";
        sensor2.sensorName = "Sensor Name 2";
        sensor2.sensorDescription = "Sensor Description 2";
        sensor2.sensorVariable = "Humidity";
        sensor2.sensorUnit = "Percentage";
        sensor2.gateway = gateway1;


        // Mock: findOne
        mockFindOne.mockResolvedValue(sensor1);

        const allSensorsReal = await repo.getSensorByNetworkCodeGatewayMacSensorMac("networkCode1", "11:11:11:11:11:11", "33:33:33:33:33:33");

        //check they correspond to the ones we created before
        expect(allSensorsReal).toBeDefined();
        expect(allSensorsReal).toBeInstanceOf(SensorDAO);
        expect(allSensorsReal.sensorMac).toBe("33:33:33:33:33:33");
        expect(allSensorsReal.sensorName).toBe("Sensor Name 1");
        expect(allSensorsReal.sensorDescription).toBe("Sensor Description 1");
        expect(allSensorsReal.sensorVariable).toBe("Temperature");
        expect(allSensorsReal.sensorUnit).toBe("Celsius");
        expect(allSensorsReal.gateway).toBeDefined();
        expect(allSensorsReal.gateway).toBeInstanceOf(GatewayDAO);
        expect(allSensorsReal.gateway.gatewayMac).toBe("11:11:11:11:11:11");
        expect(allSensorsReal.gateway.gatewayName).toBe("Gateway Name 1");
        expect(allSensorsReal.gateway.gatewayDescription).toBe("G Description 1");
        expect(allSensorsReal.gateway.network).toBeDefined();
        expect(allSensorsReal.gateway.network).toBeInstanceOf(NetworkDAO);
        expect(allSensorsReal.gateway.network.networkCode).toBe("networkCode1");
        expect(allSensorsReal.gateway.network.networkName).toBe("Network Name");
        expect(allSensorsReal.gateway.network.networkDescription).toBe("Description 1");
        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                sensorMac: "33:33:33:33:33:33",
                gateway: {
                    gatewayMac: "11:11:11:11:11:11",
                    network: { networkCode: "networkCode1" }
                }
            },
            relations: []
        });
    });

    it("get sensor by non-existing network code and existing gateway mac and sensor mac - NotFoundError thrown", async () => {
        // Simulate a net with a non-existing networkCode
        mockFindOne.mockResolvedValue(undefined);

        //Now try to get a sensor inserting a networkCode not present in the database
        //A NotFoundError should be thrown
        await expect(repo.getSensorByNetworkCodeGatewayMacSensorMac("ghost", "11:11:11:11:11:11", "33:33:33:33:33:33", true)).rejects.toThrow(NotFoundError);
        
        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                sensorMac: "33:33:33:33:33:33",
                gateway: {
                    gatewayMac: "11:11:11:11:11:11",
                    network: { networkCode: "ghost" }
                }
            },
            relations: ["gateway"]
        });
    });

    it("get sensor by existing network code and non-existing gateway mac and existing sensor mac - NotFoundError thrown", async () => {
        // Simulate a net with a non-existing networkCode
        mockFindOne.mockResolvedValue(undefined);

        //Now try to get a sensor inserting a networkCode not present in the database
        //A NotFoundError should be thrown
        await expect(repo.getSensorByNetworkCodeGatewayMacSensorMac("networkCode1", "non-existent-mac", "33:33:33:33:33:33", true)).rejects.toThrow(NotFoundError);
        
        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                sensorMac: "33:33:33:33:33:33",
                gateway: {
                    gatewayMac: "non-existent-mac",
                    network: { networkCode: "networkCode1" }
                }
            },
            relations: ["gateway"]
        });
    });

    it("get sensor by existing network code and existing gateway mac and non-existing sensor mac - NotFoundError thrown", async () => {
        // Simulate a net with a non-existing networkCode
        mockFindOne.mockResolvedValue(undefined);

        //Now try to get a sensor inserting a networkCode not present in the database
        //A NotFoundError should be thrown
        await expect(repo.getSensorByNetworkCodeGatewayMacSensorMac("networkCode1","11:11:11:11:11:11", "non-existent-mac", true)).rejects.toThrow(NotFoundError);
        
        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                sensorMac:"non-existent-mac",
                gateway: {
                    gatewayMac: "11:11:11:11:11:11",
                    network: { networkCode: "networkCode1" }
                }
            },
            relations: ["gateway"]
        });
    });


    it("update sensor", async () => {
        //mockFind should not return a sensor, meaning the new sensor mac is ok
        mockFind.mockResolvedValue([]);


        //mockUpdate should return affected rows = 1, meaning the sensor was found and updated
        const mockUpdateResult: UpdateResult =  {
            raw: [], //not important for this test
            affected: 1,
            generatedMaps: [] //not important for this test
        }

        //simulate find returns an existing gateway
        const existingNet = new NetworkDAO();
        existingNet.networkCode = "networkCode1";
        existingNet.networkName = "Network Name";
        existingNet.networkDescription = "Description 1";

        const gateway1 = new GatewayDAO();
        gateway1.gatewayMac = "11:11:11:11:11:11";
        gateway1.gatewayName = "Gateway Name 1";
        gateway1.gatewayDescription = "G Description 1";
        gateway1.network = existingNet;

        mockFindOne.mockResolvedValue(gateway1); //mock the findOne method to return a gateway

        mockUpdate.mockResolvedValue(mockUpdateResult);

        //attempt to update the gateway
        const sensorUpdate: Partial<SensorDAO> = {
            sensorMac: "22:22:22:22:22:22", 
            sensorName: "New Name",
            sensorDescription: "New Description",
            sensorVariable: "Temperature",
            sensorUnit: "Celsius"
        };

        const updatedSensor = await repo.updateSensor("networkCode1", "11:11:11:11:11:11", "33:33:33:33:33:33", sensorUpdate);

        //check that mockUpdate has been called with the correct parameters
        expect(mockUpdate).toHaveBeenCalledWith(
            {
                sensorMac: "33:33:33:33:33:33",
                gateway: { 
                    gatewayMac: "11:11:11:11:11:11",
                }
            },
            sensorUpdate
        );

        //Check that the mockFind has been called with the correct parameters
        expect(mockFind).toHaveBeenCalledWith({
            where : {
                sensorMac: "22:22:22:22:22:22",
            }
        });

        //Check that the mockFindOne has been called with the correct parameters
        expect(mockFindOne).toHaveBeenCalledWith({
            where : {
                gatewayMac: "11:11:11:11:11:11",
                network: { networkCode: "networkCode1" }
            }
        });
        
    });

    it("update sensor - conflict error", async () => {

        //simulate find returns an existing sensor
        //this means the new sensor mac is already in use
        //so a ConflictError should be thrown
        const existingSensor = new SensorDAO(); //params are not important for this test
        existingSensor.sensorMac = "22:22:22:22:22:22";

        mockFind.mockResolvedValue([existingSensor]);

        //attempt to update the gateway
        const sensorUpdate: Partial<SensorDAO> = {
            sensorMac: "22:22:22:22:22:22", // changing to a conflicting MAC
            sensorName: "New Name",
            sensorDescription: "New Description",
            sensorVariable: "Temperature",
            sensorUnit: "Celsius"
        };

        await expect(repo.updateSensor("networkCode1", "11:11:11:11:11:11", "33:33:33:33:33:33", sensorUpdate)).rejects.toThrow(ConflictError);

        //Check that the mockFind has been called with the correct parameters
        expect(mockFind).toHaveBeenCalledWith({
            where : {
                sensorMac: "22:22:22:22:22:22",
            }
        });
        
    });

    it("update sensor - no sensor found to update, NotFoundError thrown", async () => {
        //mockFind should not return a sensor, meaning the new sensor mac is ok
        mockFind.mockResolvedValue([]);
        //mockUpdate should return affected rows = 0, meaning the sensor was not found
        const mockUpdateResult: UpdateResult =  {
            raw: [], //not important for this test      
            affected: 0,
            generatedMaps: [] //not important for this test
        }
        mockUpdate.mockResolvedValue(mockUpdateResult);


        //simulate find returns an existing gateway
        const existingNet = new NetworkDAO();
        existingNet.networkCode = "networkCode1";
        existingNet.networkName = "Network Name";
        existingNet.networkDescription = "Description 1";

        const gateway1 = new GatewayDAO();
        gateway1.gatewayMac = "11:11:11:11:11:11";
        gateway1.gatewayName = "Gateway Name 1";
        gateway1.gatewayDescription = "G Description 1";
        gateway1.network = existingNet;

        mockFindOne.mockResolvedValue(gateway1); //mock the findOne method to return a gateway

        //attempt to update the gateway
        const sensorUpdate: Partial<SensorDAO> = {
            sensorMac: "22:22:22:22:22:22",
            sensorName: "New Name",
            sensorDescription: "New Description",
            sensorVariable: "Temperature",
            sensorUnit: "Celsius"
        };
        await expect(repo.updateSensor("networkCode1", "11:11:11:11:11:11", "33:33:33:33:33:33", sensorUpdate)).rejects.toThrow(NotFoundError);     
        //check that mockUpdate has been called with the correct parameters
        expect(mockUpdate).toHaveBeenCalledWith(
            {
                sensorMac: "33:33:33:33:33:33",
                gateway: { 
                    gatewayMac: "11:11:11:11:11:11",
                }
            },
            sensorUpdate
        );

        // //Check that the mockFind has been called with the correct parameters
        expect(mockFind).toHaveBeenCalledWith({
            where : {
                sensorMac: "22:22:22:22:22:22",
            }
        });

        //Check that the mockFindOne has been called with the correct parameters
        expect(mockFindOne).toHaveBeenCalledWith({
            where : {
                gatewayMac: "11:11:11:11:11:11",
                network: { networkCode: "networkCode1" }
            }
        });
    });

    it("update sensor - no gateway found to update, NotFoundError thrown", async () => {

        //mockFind should not return a sensor, meaning the new sensor mac is ok
        mockFind.mockResolvedValue([]);

        //mockUpdate should return affected rows = 0, meaning the gateway was not found
        const mockUpdateResult: UpdateResult =  {
            raw: [], //not important for this test      
            affected: 0,
            generatedMaps: [] //not important for this test
        }
        mockUpdate.mockResolvedValue(mockUpdateResult);


        mockFindOne.mockResolvedValue(undefined); //mock the findOne method to not return a gateway

        //attempt to update the gateway
        const sensorUpdate: Partial<SensorDAO> = {
            sensorMac: "22:22:22:22:22:22",
            sensorName: "New Name",
            sensorDescription: "New Description",
            sensorVariable: "Temperature",
            sensorUnit: "Celsius"
        };
        await expect(repo.updateSensor("networkCode1", "11:11:11:11:11:11", "33:33:33:33:33:33", sensorUpdate)).rejects.toThrow(NotFoundError);     
        

        // //Check that the mockFind has been called with the correct parameters
        expect(mockFind).toHaveBeenCalledWith({
            where : {
                sensorMac: "22:22:22:22:22:22",
            }
        });

        //Check that the mockFindOne has been called with the correct parameters
        expect(mockFindOne).toHaveBeenCalledWith({
            where : {
                gatewayMac: "11:11:11:11:11:11",
                network: { networkCode: "networkCode1" }
            }
        });
    });

    it("delete sensor", async () => {

        //simulate findOne returns an existing gateway
        const existingNet = new NetworkDAO();
        existingNet.networkCode = "networkCode1";
        existingNet.networkName = "Network Name";
        existingNet.networkDescription = "Description 1";

        const gateway1 = new GatewayDAO();
        gateway1.gatewayMac = "11:11:11:11:11:11";
        gateway1.gatewayName = "Gateway Name 1";
        gateway1.gatewayDescription = "G Description 1";
        gateway1.network = existingNet;

        mockFindOne.mockResolvedValue(gateway1); //mock the findOne method to return a gateway


        //simulate the delete method returns 1 affected rows, meaning the sensor was found and deleted
        const mockDeleteResult: DeleteResult = {
            raw: [], //not important for this test
            affected: 1
        };

        mockDelete.mockResolvedValue(mockDeleteResult);

        await expect(repo.deleteSensor("networkCode1", "11:11:11:11:11:11", "33:33:33:33:33:33")).resolves.not.toThrow();


        //Check that the mockDelete has been called with the correct parameters
        expect(mockDelete).toHaveBeenCalledWith({
            sensorMac: "33:33:33:33:33:33",
            gateway: {
                gatewayMac: "11:11:11:11:11:11",
            }
        });

        //Check that the mockFindOne has been called with the correct parameters
        expect(mockFindOne).toHaveBeenCalledWith({
            where : {
                gatewayMac: "11:11:11:11:11:11",
                network: { networkCode: "networkCode1" }
            }
        });
    
    });
    
    it("delete sensor: not found", async () => {
        //simulate the delete method returns 0 affected rows, meaning the sensor was not found
        const mockDeleteResult: DeleteResult = {
            raw: [], //not important for this test
            affected: 0
        };

        //simulate findOne returns an existing gateway
        const existingNet = new NetworkDAO();
        existingNet.networkCode = "networkCode1";
        existingNet.networkName = "Network Name";
        existingNet.networkDescription = "Description 1";

        const gateway1 = new GatewayDAO();
        gateway1.gatewayMac = "11:11:11:11:11:11";
        gateway1.gatewayName = "Gateway Name 1";
        gateway1.gatewayDescription = "G Description 1";
        gateway1.network = existingNet;

        mockFindOne.mockResolvedValue(gateway1); //mock the findOne method to return a gateway


        mockDelete.mockResolvedValue(mockDeleteResult);

        await expect(repo.deleteSensor("networkCode1", "11:11:11:11:11:11", "33:33:33:33:33:33")).rejects.toThrow(NotFoundError);

        //Check that the mockDelete has been called with the correct parameters
        expect(mockDelete).toHaveBeenCalledWith({
            sensorMac: "33:33:33:33:33:33",
            gateway: {
                gatewayMac: "11:11:11:11:11:11",
            }
        });

        //Check that the mockFindOne has been called with the correct parameters
        expect(mockFindOne).toHaveBeenCalledWith({
            where : {
                gatewayMac: "11:11:11:11:11:11",
                network: { networkCode: "networkCode1" }
            }
        });

    });

    it("delete sensor: gateway not found", async () => {
        

        mockFindOne.mockResolvedValue(undefined); //mock the findOne method to not return a gateway

        await expect(repo.deleteSensor("networkCode1", "11:11:11:11:11:11", "33:33:33:33:33:33")).rejects.toThrow(NotFoundError);


        //Check that the mockFindOne has been called with the correct parameters
        expect(mockFindOne).toHaveBeenCalledWith({
            where : {
                gatewayMac: "11:11:11:11:11:11",
                network: { networkCode: "networkCode1" }
            }
        });

    });
});