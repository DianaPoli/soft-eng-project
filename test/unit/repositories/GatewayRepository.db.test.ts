import { NetworkRepository, GatewayRepository, SensorRepository } from "@repositories/index";
import {
    initializeTestDataSource,
    closeTestDataSource,
    TestDataSource
  } from "@test/setup/test-datasource";
import { NetworkDAO, GatewayDAO, SensorDAO } from "@dao/index";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

const alreadyCreatedNetwork = {
    networkCode: "networkCode",
    networkName: "networkName",
    networkDescription: "networkDescription",
};

beforeAll(async () => {
    await initializeTestDataSource();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    await TestDataSource.getRepository(GatewayDAO).clear();
    await TestDataSource.getRepository(NetworkDAO).clear();

    //Create a network to be used in the tests
    const networkRepo = new NetworkRepository();
    const savedNetwork = await networkRepo.createNetwork(
        alreadyCreatedNetwork.networkCode,
        alreadyCreatedNetwork.networkName,
        alreadyCreatedNetwork.networkDescription
    );

    expect(savedNetwork).toBeDefined();
    expect(savedNetwork.networkCode).toBe(alreadyCreatedNetwork.networkCode);
    expect(savedNetwork.networkName).toBe(alreadyCreatedNetwork.networkName);
    expect(savedNetwork.networkDescription).toBe(alreadyCreatedNetwork.networkDescription);

});

describe("GatewayRepository - SQLite in memory", () => {

    const repo = new GatewayRepository();

    it("create a gateway", async () => {

        //create a new gateway belonging to the network created in the beforeEach
        const newGateway = await repo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "gatewayMac",
            "gatewayName",
            "gatewayDescription"
        );

        expect(newGateway).toBeDefined();
        expect(newGateway.gatewayMac).toBe("gatewayMac");
        expect(newGateway.gatewayName).toBe("gatewayName");
        expect(newGateway.gatewayDescription).toBe("gatewayDescription");
        
        //check if the gateway is linked to the network
        expect(newGateway.network).toBeDefined();
        expect(newGateway.network.networkCode).toBe(alreadyCreatedNetwork.networkCode);
        expect(newGateway.network.networkName).toBe(alreadyCreatedNetwork.networkName);
        expect(newGateway.network.networkDescription).toBe(alreadyCreatedNetwork.networkDescription);

        //for now the gateway has no sensors, so the array of sensors should be undefined when the gateway is created
        //later on, TypeORM will set it to an empty array when the gateway is saved in the database
        expect(newGateway.sensors).toBeUndefined();


        //now check if the gateway is saved in the database
        //try to search it by gatewayMac
        //just for testing purposes, load also the network relation (upper relation) to check if it is correct
        const foundGateway = await repo.getGatewayByNetworkCodeGatewayMac(alreadyCreatedNetwork.networkCode, newGateway.gatewayMac, true);
        expect(foundGateway).toBeDefined();
        expect(foundGateway.gatewayMac).toBe(newGateway.gatewayMac);
        expect(foundGateway.gatewayName).toBe(newGateway.gatewayName);
        expect(foundGateway.gatewayDescription).toBe(newGateway.gatewayDescription);

        //check if the gateway is linked to the network
        expect(foundGateway.network).toBeDefined();
        expect(foundGateway.network.networkCode).toBe(alreadyCreatedNetwork.networkCode);
        expect(foundGateway.network.networkName).toBe(alreadyCreatedNetwork.networkName);
        expect(foundGateway.network.networkDescription).toBe(alreadyCreatedNetwork.networkDescription);

        //for now the gateway has no sensors, so the array of sensors should be empty
        expect(foundGateway.sensors).toBeDefined();
        expect(foundGateway.sensors.length).toBe(0);

    });

    it("create a gateway - test nullable fields", async () => {
        //create a new gateway belonging to the network created in the beforeEach
        const newGateway = await repo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "gatewayMac",
            undefined, //gatewayName is optional
            undefined //gatewayDescription is optional
        );

        expect(newGateway).toBeDefined();
        expect(newGateway.gatewayMac).toBe("gatewayMac");
        expect(newGateway.gatewayName).toBe(null);
        expect(newGateway.gatewayDescription).toBe(null);

        //check if the gateway is linked to the network
        expect(newGateway.network).toBeDefined();
        expect(newGateway.network.networkCode).toBe(alreadyCreatedNetwork.networkCode);
        expect(newGateway.network.networkName).toBe(alreadyCreatedNetwork.networkName);
        expect(newGateway.network.networkDescription).toBe(alreadyCreatedNetwork.networkDescription);

        //now get the gateway by networkCode and gatewayMac
        const foundGateway = await repo.getGatewayByNetworkCodeGatewayMac(
            alreadyCreatedNetwork.networkCode,
            newGateway.gatewayMac,
            false
        );

        expect(foundGateway).toBeDefined();
        expect(foundGateway.gatewayMac).toBe("gatewayMac");
        expect(foundGateway.gatewayName).toBe(null);
        expect(foundGateway.gatewayDescription).toBe(null);


    });

    it("create a gateway - conflict error", async () => {
        //create a new gateway belonging to the network created in the beforeEach
        const newGateway = await repo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "gatewayMac",
            "gatewayName",
            "gatewayDescription"
        );

        expect(newGateway).toBeDefined();
        expect(newGateway.gatewayMac).toBe("gatewayMac");
        expect(newGateway.gatewayName).toBe("gatewayName");
        expect(newGateway.gatewayDescription).toBe("gatewayDescription");

        //try to create a new gateway with the same getwayMac as newGateway, it should throw a ConflictError
        await expect(async () => {
            await repo.createGateway(
                alreadyCreatedNetwork.networkCode,
                "gatewayMac",
                "otherGatewayName",
                "otherGatewayDescription"
            );
        }).rejects.toThrow(ConflictError);

        //search the gateway by gatewayMac to check if it is still there and has the original name and description
        const foundGateway = await repo.getGatewayByNetworkCodeGatewayMac(alreadyCreatedNetwork.networkCode, newGateway.gatewayMac);
        expect(foundGateway).toBeDefined();
        expect(foundGateway.gatewayMac).toBe(newGateway.gatewayMac);
        expect(foundGateway.gatewayName).toBe(newGateway.gatewayName);
        expect(foundGateway.gatewayDescription).toBe(newGateway.gatewayDescription);


    });

    it("create a gateway - not found error", async () => {
        //try to create a new gateway with a networkCode that does not exist, it should throw a NotFoundError
        //since the networkCode is not found, the gateway cannot be created
        await expect(async () => {
            await repo.createGateway(
                "nonExistentNetworkCode", //this networkCode does not exist in the database!!
                "gatewayMac",
                "gatewayName",
                "gatewayDescription"
            );
        }).rejects.toThrow(NotFoundError);
    });

    it("get all gateways by networkCode", async () => {

        //create two sample gateways belonging to the network created in the beforeEach
        const newGateway1 = await repo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "gatewayMac1",
            "gatewayName1",
            "gatewayDescription1"
        );
        const newGateway2 = await repo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "gatewayMac2",
            "gatewayName2",
            "gatewayDescription2"
        );

        expect(newGateway1).toBeDefined();
        expect(newGateway1.gatewayMac).toBe("gatewayMac1");
        expect(newGateway1.gatewayName).toBe("gatewayName1");
        expect(newGateway1.gatewayDescription).toBe("gatewayDescription1");

        expect(newGateway2).toBeDefined();
        expect(newGateway2.gatewayMac).toBe("gatewayMac2");
        expect(newGateway2.gatewayName).toBe("gatewayName2");
        expect(newGateway2.gatewayDescription).toBe("gatewayDescription2");

        //check if the gateways are linked to the network
        expect(newGateway1.network).toBeDefined();
        expect(newGateway1.network.networkCode).toBe(alreadyCreatedNetwork.networkCode);

        expect(newGateway2.network).toBeDefined();
        expect(newGateway2.network.networkCode).toBe(alreadyCreatedNetwork.networkCode);

        //now get all the gateways
        //use loadNetwork=true to check networks
        const foundGateways = await repo.getAllGatewaysByNetworkCode(alreadyCreatedNetwork.networkCode, true);
        expect(foundGateways).toBeDefined();
        expect(foundGateways.length).toBe(2); //we have created two gateways for the same network

        //sort the gateways by gatewayMac to check if they are the same as the ones created above
        foundGateways.sort((a, b) => a.gatewayMac.localeCompare(b.gatewayMac));
        //now foundGateway[0] should be the one with gatewayMac1 and foundGateway[1] should be the one with gatewayMac2

        //in this case both gateways belong to the same network, so they should be linked to it
        expect(foundGateways[0]).toBeDefined();
        expect(foundGateways[0].gatewayMac).toBe("gatewayMac1");
        expect(foundGateways[0].network).toBeDefined();
        expect(foundGateways[0].network.networkCode).toBe(alreadyCreatedNetwork.networkCode);

        expect(foundGateways[1]).toBeDefined();
        expect(foundGateways[1].gatewayMac).toBe("gatewayMac2");
        expect(foundGateways[1].network).toBeDefined();
        expect(foundGateways[1].network.networkCode).toBe(alreadyCreatedNetwork.networkCode);
        

    });


    it("get all gateways by networkCode - not found error", async () => {
        //try to get all gateways by a networkCode that does not exist, it should throw a NotFoundError
        await expect(async () => {
            await repo.getAllGatewaysByNetworkCode("nonExistentNetworkCode"); //this networkCode does not exist in the database!!
        }).rejects.toThrow(NotFoundError);
    });

    it("get all gateways by networkCode - empty array", async () => {
        //we can simply use the networkCode of the network created in the beforeEach, since we have not created any gateways yet
        const foundGateways = await repo.getAllGatewaysByNetworkCode(alreadyCreatedNetwork.networkCode);

        expect(foundGateways).toBeDefined();
        expect(foundGateways.length).toBe(0); //since we have not created any gateways yet, the array should be empty
        
    });


    it("get all gateways of all networks", async () => {
        //create another network to test the getAllGatewaysOfAllNetworks method
        const networkRepo = new NetworkRepository();
        const newNetwork = await networkRepo.createNetwork(
            "newNetworkCode",
            "newNetworkName",
            "newNetworkDescription"
        );
        expect(newNetwork).toBeDefined();
        expect(newNetwork.networkCode).toBe("newNetworkCode");
        expect(newNetwork.networkName).toBe("newNetworkName");
        expect(newNetwork.networkDescription).toBe("newNetworkDescription");

        //create gateway 1 belongin to the first network created in the beforeEach
        const newGateway1 = await repo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "gatewayMac1",
            "gatewayName1",
            "gatewayDescription1"
        );

        expect(newGateway1).toBeDefined();
        expect(newGateway1.gatewayMac).toBe("gatewayMac1");
        expect(newGateway1.network).toBeDefined();
        expect(newGateway1.network.networkCode).toBe(alreadyCreatedNetwork.networkCode);

        //create gateway 2 belonging to the new network created above
        const newGateway2 = await repo.createGateway(
            newNetwork.networkCode,
            "gatewayMac2",
            "gatewayName2",
            "gatewayDescription2"
        );

        expect(newGateway2).toBeDefined();
        expect(newGateway2.gatewayMac).toBe("gatewayMac2");
        expect(newGateway2.network).toBeDefined();
        expect(newGateway2.network.networkCode).toBe(newNetwork.networkCode);


        //not get all gateways, independently of the network they belong to
        //use loadNetwork=true to check networks
        const foundGateways = await repo.getAllGateways(true);

        expect(foundGateways).toBeDefined();
        expect(foundGateways.length).toBe(2); //we have created two gateways, one for each network

        //sort the gateways by gatewayMac to check if they are the same as the ones created above
        foundGateways.sort((a, b) => a.gatewayMac.localeCompare(b.gatewayMac));
        //now foundGateway[0] should be the one with gatewayMac1 and foundGateway[1] should be the one with gatewayMac2

        expect(foundGateways[0]).toBeDefined();
        expect(foundGateways[0].gatewayMac).toBe("gatewayMac1");
        expect(foundGateways[0].network).toBeDefined();
        expect(foundGateways[0].network.networkCode).toBe(alreadyCreatedNetwork.networkCode);
        
        expect(foundGateways[1]).toBeDefined();
        expect(foundGateways[1].gatewayMac).toBe("gatewayMac2");
        expect(foundGateways[1].network).toBeDefined();
        expect(foundGateways[1].network.networkCode).toBe(newNetwork.networkCode);

    })

    it("get all gateways of all networks - empty array", async () => {
        //we can simply use the networkCode of the network created in the beforeEach, since we have not created any gateways yet
        const foundGateways = await repo.getAllGateways();

        expect(foundGateways).toBeDefined();
        expect(foundGateways.length).toBe(0); //since we have not created any gateways yet, the array should be empty
        
    });

    it("get gateway by networkCode and gatewayMac", async () => {

        //create a new gateway belonging to the network created in the beforeEach
        const newGateway = await repo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "gatewayMac",
            "gatewayName",
            "gatewayDescription"
        );

        expect(newGateway).toBeDefined();
        expect(newGateway.gatewayMac).toBe("gatewayMac");
        expect(newGateway.gatewayName).toBe("gatewayName");
        expect(newGateway.gatewayDescription).toBe("gatewayDescription");


        //now attempt to get the gateway by networkCode and gatewayMac
        //use loadNetwork=true to check network

        const foundGateway = await repo.getGatewayByNetworkCodeGatewayMac(
            alreadyCreatedNetwork.networkCode,
            newGateway.gatewayMac,
            true
        );

        expect(foundGateway).toBeDefined();
        expect(foundGateway.gatewayMac).toBe("gatewayMac");
        expect(foundGateway.gatewayName).toBe("gatewayName");
        expect(foundGateway.gatewayDescription).toBe("gatewayDescription");

        //check if the gateway is linked to the network
        expect(foundGateway.network).toBeDefined();
        expect(foundGateway.network.networkCode).toBe(alreadyCreatedNetwork.networkCode);
    });

    it("get gateway by networkCode and gatewayMac - not found error (non existing gatewayMac)", async () => {
        //try to get a gateway by gatewayMac which does not exist, it should throw a NotFoundError
        await expect(async () => {
            await repo.getGatewayByNetworkCodeGatewayMac(
                alreadyCreatedNetwork.networkCode,
                "nonExistentGatewayMac" //this gatewayMac does not exist in the database!!
            );
        }).rejects.toThrow(NotFoundError);
    });

    it("get gateway by networkCode and gatewayMac - not found error (non existing networkCode)", async () => {
        //try to get a gateway by networkCode which does not exist, it should throw a NotFoundError
        await expect(async () => {
            await repo.getGatewayByNetworkCodeGatewayMac(
                "nonExistentNetworkCode", //this networkCode does not exist in the database!!
                "gatewayMac" //this is still unexisting, but the execution will not reach this point
            );
        }).rejects.toThrow(NotFoundError);
    });

    it("update gateway", async () => {
        //create a new gateway belonging to the network created in the beforeEach
        let newGateway = await repo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "gatewayMac",
            "gatewayName",
            "gatewayDescription"
        );

        expect(newGateway).toBeDefined();
        expect(newGateway.gatewayMac).toBe("gatewayMac");
        expect(newGateway.gatewayName).toBe("gatewayName");
        expect(newGateway.gatewayDescription).toBe("gatewayDescription");

        //now update the gateway with a new name and description
        const gatewayUpdate: Partial<GatewayDAO> = {
            gatewayName: "newGatewayName",
            gatewayDescription: "newGatewayDescription",
        };

        await repo.updateGateway(
            alreadyCreatedNetwork.networkCode,
            newGateway.gatewayMac,
            gatewayUpdate
        );

        //search the gateway by gatewayMac to check if it is still there and has the new name and description
        const foundGateway = await repo.getGatewayByNetworkCodeGatewayMac(alreadyCreatedNetwork.networkCode, newGateway.gatewayMac);
        expect(foundGateway).toBeDefined();
        expect(foundGateway.gatewayMac).toBe(newGateway.gatewayMac);
        expect(foundGateway.gatewayName).toBe(gatewayUpdate.gatewayName);
        expect(foundGateway.gatewayDescription).toBe(gatewayUpdate.gatewayDescription);

        //now update the gateway with a new name and description and a new gatewayMac
        const gatewayUpdate1: Partial<GatewayDAO> = {
            gatewayMac: "newGatewayMac1",
            gatewayName: "newGatewayName1",
            gatewayDescription: "newGatewayDescription1",
        };

        await repo.updateGateway(
            alreadyCreatedNetwork.networkCode,
            newGateway.gatewayMac,
            gatewayUpdate1
        );

        //search the gateway by gatewayMac to check if it is still there and has the new name and description
        const foundGateway1 = await repo.getGatewayByNetworkCodeGatewayMac(alreadyCreatedNetwork.networkCode, gatewayUpdate1.gatewayMac);
        expect(foundGateway1).toBeDefined();
        expect(foundGateway1.gatewayMac).toBe(gatewayUpdate1.gatewayMac);
        expect(foundGateway1.gatewayName).toBe(gatewayUpdate1.gatewayName);
        expect(foundGateway1.gatewayDescription).toBe(gatewayUpdate1.gatewayDescription);

        

    });

    it("update gateway - conflict error ", async () => {
        //create a new gateway belonging to the network created in the beforeEach
        let newGateway = await repo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "gatewayMac",
            "gatewayName",
            "gatewayDescription"
        );

        expect(newGateway).toBeDefined();
        expect(newGateway.gatewayMac).toBe("gatewayMac");


        //now create another gateway belonging to the same network
        const newGateway2 = await repo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "gatewayMac2",
            "gatewayName2",
            "gatewayDescription2"
        );
        expect(newGateway2).toBeDefined();
        expect(newGateway2.gatewayMac).toBe("gatewayMac2");


        //now try to update the first gateway with the same gatewayMac as the second one, it should throw a ConflictError
        const gatewayUpdate: Partial<GatewayDAO> = {
            gatewayMac: newGateway2.gatewayMac,
        };

        await expect(async () => {
            await repo.updateGateway(
                alreadyCreatedNetwork.networkCode,
                newGateway.gatewayMac,
                gatewayUpdate
            );
        }).rejects.toThrow(ConflictError);

    });

    it("update gateway - not found error (non existing networkCode)", async () => {
        //create a new gateway belonging to the network created in the beforeEach
        let newGateway = await repo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "gatewayMac",
            "gatewayName",
            "gatewayDescription"
        );

        expect(newGateway).toBeDefined();
        expect(newGateway.gatewayMac).toBe("gatewayMac");

        //try to update the gateway with a networkCode that does not exist, it should throw a NotFoundError
        const gatewayUpdate: Partial<GatewayDAO> = {
            gatewayName: "newGatewayName",
            gatewayDescription: "newGatewayDescription",
        };

        await expect(async () => {
            await repo.updateGateway(
                "nonExistentNetworkCode", //this networkCode does not exist in the database!!
                newGateway.gatewayMac,
                gatewayUpdate
            );
        }).rejects.toThrow(NotFoundError);
    });

    it("update gateway - not found error (non existing gatewayMac)", async () => {
        //try to update a gateway with a gatewayMac that does not exist, it should throw a NotFoundError
        const gatewayUpdate: Partial<GatewayDAO> = {
            gatewayName: "newGatewayName",
            gatewayDescription: "newGatewayDescription",
        };

        await expect(async () => {
            await repo.updateGateway(
                alreadyCreatedNetwork.networkCode,
                "nonExistentGatewayMac", //this gatewayMac does not exist in the database!!
                gatewayUpdate
            );
        }).rejects.toThrow(NotFoundError);
    });

    it("update gateway - not fouund error (both network and gateway exist, but network has not the specified gateway)", async () => {
        //create a new gateway belonging to the network created in the beforeEach
        let newGateway = await repo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "gatewayMac",
            "gatewayName",
            "gatewayDescription"
        );

        expect(newGateway).toBeDefined();
        expect(newGateway.gatewayMac).toBe("gatewayMac");

        //create another network to test the updateGateway method
        const networkRepo = new NetworkRepository();
        const newNetwork = await networkRepo.createNetwork(
            "newNetworkCode",
            "newNetworkName",
            "newNetworkDescription"
        );
        expect(newNetwork).toBeDefined();
        expect(newNetwork.networkCode).toBe("newNetworkCode");


        //now, try to update the gateway newGateway which belongs to the network created in the beforeEach, but using the new networkCode of the oter networkù
        //both network and gateway exist, but the network has not the specified gateway, so it should throw a NotFoundError

        const gatewayUpdate: Partial<GatewayDAO> = {
            gatewayName: "newGatewayName",
            gatewayDescription: "newGatewayDescription",
        };

        await expect(async () => {
            await repo.updateGateway(
                newNetwork.networkCode, //this networkCode does not have the specified gateway!!
                newGateway.gatewayMac,
                gatewayUpdate
            );
        }).rejects.toThrow(NotFoundError);

    });

    it("update gateway - update sensors gatewayMac on cascade", async () => {
        //just for this, we need Sensor repo as well
        await TestDataSource.getRepository(SensorDAO).clear();
        const sensorRepo = new SensorRepository();

        //crete a new gateway belonging to the network created in the beforeEach
        let newGateway = await repo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "gatewayMac",
            "gatewayName",
            "gatewayDescription"
        );

        expect(newGateway).toBeDefined();
        expect(newGateway.gatewayMac).toBe("gatewayMac");

        //now attach a new sensor to this gateway belonging to the network created in the beforeEach
        const newSensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            newGateway.gatewayMac,
            "sensorMac",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(newSensor).toBeDefined();
        expect(newSensor.sensorMac).toBe("sensorMac");
        expect(newSensor.gateway).toBeDefined();
        expect(newSensor.gateway.gatewayMac).toBe(newGateway.gatewayMac);


        //now update the gateway with a new gatewayMac, it should update the sensor too since we have set the onUpdate to CASCADE in the relation between gateway and sensor
        const gatewayUpdate: Partial<GatewayDAO> = {
            gatewayMac: "newGatewayMac",
        }

        await repo.updateGateway(
            alreadyCreatedNetwork.networkCode,
            newGateway.gatewayMac,
            gatewayUpdate
        );

        //now get the updated gateway by the new gatewayMac
        const foundGateway = await repo.getGatewayByNetworkCodeGatewayMac(
            alreadyCreatedNetwork.networkCode,
            gatewayUpdate.gatewayMac,
        );

        //check if it still has the sensor
        expect(foundGateway).toBeDefined();
        expect(foundGateway.gatewayMac).toBe(gatewayUpdate.gatewayMac);
        expect(foundGateway.sensors).toBeDefined();
        expect(foundGateway.sensors.length).toBe(1); //we have created one sensor for the gateway
        expect(foundGateway.sensors[0]).toBeDefined();
        expect(foundGateway.sensors[0].sensorMac).toBe(newSensor.sensorMac); 

        //now retrieve the sensor by its sensorMac and check if it has the new gatewayMac
        const foundSensor = await sensorRepo.getSensorByNetworkCodeGatewayMacSensorMac(
            alreadyCreatedNetwork.networkCode,
            gatewayUpdate.gatewayMac,
            newSensor.sensorMac,
            true
        );

        expect(foundSensor).toBeDefined();
        expect(foundSensor.sensorMac).toBe(newSensor.sensorMac);
        //check if the sensor is linked to the gateway with the new gatewayMac
        expect(foundSensor.gateway).toBeDefined();
        expect(foundSensor.gateway.gatewayMac).toBe(gatewayUpdate.gatewayMac); 

        //just to be sure, load the sensors 
        const foundSensors = await sensorRepo.getAllSensors(true);
        expect(foundSensors).toBeDefined();
        expect(foundSensors.length).toBe(1); //we have created one sensor for the gateway

        //check if the sensor is linked to the gateway with the new gatewayMac
        expect(foundSensors[0]).toBeDefined();
        expect(foundSensors[0].sensorMac).toBe(newSensor.sensorMac);
        expect(foundSensors[0].gateway).toBeDefined();
        expect(foundSensors[0].gateway.gatewayMac).toBe(gatewayUpdate.gatewayMac);
    });

    it("delete gateway", async () => {
        //create a new gateway belonging to the network created in the beforeEach
        let newGateway = await repo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "gatewayMac",
            "gatewayName",
            "gatewayDescription"
        );

        expect(newGateway).toBeDefined();
        expect(newGateway.gatewayMac).toBe("gatewayMac");

        //now delete the gateway
        await repo.deleteGateway(alreadyCreatedNetwork.networkCode, newGateway.gatewayMac);

        //try to get the gateway by networkCode and gatewayMac, it should throw a NotFoundError
        await expect(async () => {
            await repo.getGatewayByNetworkCodeGatewayMac(
                alreadyCreatedNetwork.networkCode,
                newGateway.gatewayMac
            );
        }).rejects.toThrow(NotFoundError);
    });

    it("delete gateway - not found error (non existing networkCode)", async () => {
        //create a new gateway belonging to the network created in the beforeEach
        let newGateway = await repo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "gatewayMac",
            "gatewayName",
            "gatewayDescription"
        );

        expect(newGateway).toBeDefined();
        expect(newGateway.gatewayMac).toBe("gatewayMac");

        //try to delete the gateway with a networkCode that does not exist, it should throw a NotFoundError
        await expect(async () => {
            await repo.deleteGateway(
                "nonExistentNetworkCode", //this networkCode does not exist in the database!!
                newGateway.gatewayMac
            );
        }).rejects.toThrow(NotFoundError);
    });

    it("delete gateway - not found error (non existing gatewayMac)", async () => {
        //try to delete a gateway with a gatewayMac that does not exist, it should throw a NotFoundError
        await expect(async () => {
            await repo.deleteGateway(
                alreadyCreatedNetwork.networkCode,
                "nonExistentGatewayMac" //this gatewayMac does not exist in the database!!
            );
        }).rejects.toThrow(NotFoundError);
    });

    it("delete gateway - delete sensors on cascade", async () => {
        //just for this, we need Sensor repo as well
        await TestDataSource.getRepository(SensorDAO).clear();
        const sensorRepo = new SensorRepository();

        //create a new gateway belonging to the network created in the beforeEach
        let newGateway = await repo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "gatewayMac",
            "gatewayName",
            "gatewayDescription"
        );

        expect(newGateway).toBeDefined();
        expect(newGateway.gatewayMac).toBe("gatewayMac");

        //now attach a new sensor to this gateway belonging to the network created in the beforeEach
        const newSensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            newGateway.gatewayMac,
            "sensorMac",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(newSensor).toBeDefined();
        expect(newSensor.sensorMac).toBe("sensorMac");
        expect(newSensor.gateway).toBeDefined();
        expect(newSensor.gateway.gatewayMac).toBe(newGateway.gatewayMac);


        //now delete the gateway, it should delete the sensor too since we have set the onDelete to CASCADE in the relation between gateway and sensor
        await repo.deleteGateway(alreadyCreatedNetwork.networkCode, newGateway.gatewayMac);

        //try to get the sensor by networkCode and sensorMac, it should throw a NotFoundError
        await expect(async () => {
            await sensorRepo.getSensorByNetworkCodeGatewayMacSensorMac(
                alreadyCreatedNetwork.networkCode,
                newGateway.gatewayMac,
                newSensor.sensorMac
            );
        }).rejects.toThrow(NotFoundError);

        //just to be sure, load all sensors, we should have an empty list
        const foundSensors = await sensorRepo.getAllSensors(true);
        expect(foundSensors).toBeDefined();
        expect(foundSensors.length).toBe(0); //we have deleted the only sensor we had, so the array should be empty
    });
   



});