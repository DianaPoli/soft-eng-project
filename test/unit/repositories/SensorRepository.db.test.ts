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


const alreadyCreatedGateway = {
    gatewayMac: "00:00:00:00:00:01",
    gatewayName: "gatewayName",
    gatewayDescription: "gatewayDescription",
    networkCode: alreadyCreatedNetwork.networkCode,
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
    await TestDataSource.getRepository(SensorDAO).clear();

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

    //create a gateway to be used in the tests and associate it with the network
    const gatewayRepo = new GatewayRepository();
    const savedGateway = await gatewayRepo.createGateway(
        alreadyCreatedNetwork.networkCode,
        alreadyCreatedGateway.gatewayMac,
        alreadyCreatedGateway.gatewayName,
        alreadyCreatedGateway.gatewayDescription
    );
    expect(savedGateway).toBeDefined();
    expect(savedGateway.gatewayMac).toBe(alreadyCreatedGateway.gatewayMac);
    expect(savedGateway.gatewayName).toBe(alreadyCreatedGateway.gatewayName);
    expect(savedGateway.gatewayDescription).toBe(alreadyCreatedGateway.gatewayDescription);
    expect(savedGateway.network).toBeDefined();
    expect(savedGateway.network.networkCode).toBe(alreadyCreatedNetwork.networkCode);

});

describe("SensorRepository - SQLite in memory", () => {

    const sensorRepo = new SensorRepository();

    it("create a sensor", async () => {
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");
        expect(sensor.sensorName).toBe("sensorName");
        expect(sensor.sensorDescription).toBe("sensorDescription");
        expect(sensor.sensorVariable).toBe("temperature");
        expect(sensor.sensorUnit).toBe("C");
        expect(sensor.gateway).toBeDefined();
        expect(sensor.gateway.gatewayMac).toBe(alreadyCreatedGateway.gatewayMac);


        //check the sensor is saved in the database
        const retrievedSensor = await sensorRepo.getSensorByNetworkCodeGatewayMacSensorMac(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            sensor.sensorMac,
            true //eager load the gateway and relation
        );

        expect(retrievedSensor).toBeDefined();
        expect(retrievedSensor.sensorMac).toBe(sensor.sensorMac);
        expect(retrievedSensor.sensorName).toBe(sensor.sensorName);
        expect(retrievedSensor.sensorDescription).toBe(sensor.sensorDescription);
        expect(retrievedSensor.sensorVariable).toBe(sensor.sensorVariable);
        expect(retrievedSensor.sensorUnit).toBe(sensor.sensorUnit);
        expect(retrievedSensor.gateway).toBeDefined();
        expect(retrievedSensor.gateway.gatewayMac).toBe(alreadyCreatedGateway.gatewayMac);

    });

    it("create a sensor - test nullable fields", async () => {
        //all fields except sensorMac are optional, so we can create a sensor with only the sensorMac
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02"
            //here it's like having many undefined...
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");
        expect(sensor.sensorName).toBe(null);
        expect(sensor.sensorDescription).toBe(null);
        expect(sensor.sensorVariable).toBe(null);
        expect(sensor.sensorUnit).toBe(null);

        //retrieve the sensor by networkCode, gatewayMac and sensorMac
        const retrievedSensor = await sensorRepo.getSensorByNetworkCodeGatewayMacSensorMac(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            sensor.sensorMac,
            false
        );

        expect(retrievedSensor).toBeDefined();
        expect(retrievedSensor.sensorMac).toBe(sensor.sensorMac);
        expect(retrievedSensor.sensorName).toBe(null);
        expect(retrievedSensor.sensorDescription).toBe(null);
        expect(retrievedSensor.sensorVariable).toBe(null);
        expect(retrievedSensor.sensorUnit).toBe(null);
    });

    it("create a sensor - conflict error", async () => {
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");

        //try to create a new sensor with the same MAC address and check it throws a ConflictError
        await expect(async () => {
            await sensorRepo.createSensor(
                alreadyCreatedNetwork.networkCode,
                alreadyCreatedGateway.gatewayMac,
                "00:00:00:00:00:02",
                "sensorName",
                "sensorDescription",
                "temperature",
                "C"
            );
        }).rejects.toThrow(ConflictError);

    });

    it("create a sensor - not found error (gateway not found)", async () => {
        //create a new sensor using a non-existing gatewayMac and check it throws a NotFoundError

        await expect(async () => {
            await sensorRepo.createSensor(
                alreadyCreatedNetwork.networkCode,
                "99:99:99:99:99:99", //non-existing gatewayMac
                "00:00:00:00:00:02",
                "sensorName",
                "sensorDescription",
                "temperature",
                "C"
            );
        }).rejects.toThrow(NotFoundError);

    });

    it("create a sensor - not found error (network not found)", async () => {
        //create a new sensor using a non-existing networkCode and check it throws a NotFoundError

        await expect(async () => {
            await sensorRepo.createSensor(
                "nonExistingNetworkCode", //non-existing networkCode
                alreadyCreatedGateway.gatewayMac,
                "00:00:00:00:00:02",
                "sensorName",
                "sensorDescription",
                "temperature",
                "C"
            );
        }).rejects.toThrow(NotFoundError);

    });


    it("get SensorByNetworkCodeGatewayMacSensorMac", async () => {
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");

        //get the sensor by networkCode, gatewayMac and sensorMac
        const retrievedSensor = await sensorRepo.getSensorByNetworkCodeGatewayMacSensorMac(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            sensor.sensorMac,
            true //eager load the gateway and relation
        );

        expect(retrievedSensor).toBeDefined();
        expect(retrievedSensor.sensorMac).toBe(sensor.sensorMac);
        expect(retrievedSensor.sensorName).toBe(sensor.sensorName);
        expect(retrievedSensor.sensorDescription).toBe(sensor.sensorDescription);
        expect(retrievedSensor.sensorVariable).toBe(sensor.sensorVariable);
        expect(retrievedSensor.sensorUnit).toBe(sensor.sensorUnit);
        expect(retrievedSensor.gateway).toBeDefined();
        expect(retrievedSensor.gateway.gatewayMac).toBe(alreadyCreatedGateway.gatewayMac);


    });

    it("get SensorByNetworkCodeGatewayMacSensorMac - not found error (sensorMac not found)", async () => {
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");


        //get the sensor by networkCode, gatewayMac and sensorMac, but now using a non-existing sensorMac and check it throws a NotFoundError
        await expect(async () => {
            await sensorRepo.getSensorByNetworkCodeGatewayMacSensorMac(
                alreadyCreatedNetwork.networkCode,
                alreadyCreatedGateway.gatewayMac,
                "00:00:00:00:00:03" //non-existing sensorMac
            );
        }).rejects.toThrow(NotFoundError);

    });

    it("get SensorByNetworkCodeGatewayMacSensorMac - not found error (gatewayMac not found)", async () => {
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");

        //get the sensor by networkCode, gatewayMac and sensorMac, but now using a non-existing gatewayMac and check it throws a NotFoundError
        await expect(async () => {
            await sensorRepo.getSensorByNetworkCodeGatewayMacSensorMac(
                alreadyCreatedNetwork.networkCode,
                "99:99:99:99:99:99", //non-existing gatewayMac
                sensor.sensorMac
            );
        }).rejects.toThrow(NotFoundError);

    });

    it("get SensorByNetworkCodeGatewayMacSensorMac - not found error (networkCode not found)", async () => {
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");

        //get the sensor by networkCode, gatewayMac and sensorMac, but now using a non-existing networkCode and check it throws a NotFoundError
        await expect(async () => {
            await sensorRepo.getSensorByNetworkCodeGatewayMacSensorMac(
                "nonExistingNetworkCode", //non-existing networkCode
                alreadyCreatedGateway.gatewayMac,
                sensor.sensorMac
            );
        }).rejects.toThrow(NotFoundError);

    });

    it("get all sensors by networkCode and gatewayMac", async () => {
        //create a first sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor1 = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor1).toBeDefined();
        expect(sensor1.sensorMac).toBe("00:00:00:00:00:02");
        expect(sensor1.gateway).toBeDefined();
        expect(sensor1.gateway.gatewayMac).toBe(alreadyCreatedGateway.gatewayMac);


        //create a second sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor2 = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:03",
            "sensorName",
            "sensorDescription",
            "humidity",
            "g/kg"
        );

        expect(sensor2).toBeDefined();
        expect(sensor2.sensorMac).toBe("00:00:00:00:00:03");
        expect(sensor2.gateway).toBeDefined();
        expect(sensor2.gateway.gatewayMac).toBe(alreadyCreatedGateway.gatewayMac);


        //now get all sensors by networkCode and gatewayMac
        const sensors = await sensorRepo.getAllSensorsByNetworkCodeGatewayMac(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            true //eager load the gateway and relation to test it
        );

        expect(sensors).toBeDefined();
        expect(sensors.length).toBe(2); //we created 2 sensors

        //sort this list by sensorMac to make the test more reliable
        sensors.sort((a, b) => a.sensorMac.localeCompare(b.sensorMac));
        //now sensor[0] should have MAC 00:00:00:00:00:02 and sensor[1] should have MAC 00:00:00:00:00:03

        //check sensor 1
        expect(sensors[0].sensorMac).toBe(sensor1.sensorMac);
        expect(sensors[0].sensorName).toBe(sensor1.sensorName);
        expect(sensors[0].sensorDescription).toBe(sensor1.sensorDescription);
        expect(sensors[0].sensorVariable).toBe(sensor1.sensorVariable);
        expect(sensors[0].sensorUnit).toBe(sensor1.sensorUnit);
        expect(sensors[0].gateway).toBeDefined();
        expect(sensors[0].gateway.gatewayMac).toBe(alreadyCreatedGateway.gatewayMac);

        //check sensor 2
        expect(sensors[1].sensorMac).toBe(sensor2.sensorMac);
        expect(sensors[1].sensorName).toBe(sensor2.sensorName);
        expect(sensors[1].sensorDescription).toBe(sensor2.sensorDescription);
        expect(sensors[1].sensorVariable).toBe(sensor2.sensorVariable);
        expect(sensors[1].sensorUnit).toBe(sensor2.sensorUnit);
        expect(sensors[1].gateway).toBeDefined();
        expect(sensors[1].gateway.gatewayMac).toBe(alreadyCreatedGateway.gatewayMac);

        //check again without loading upper relations
        const sensors2 = await sensorRepo.getAllSensorsByNetworkCodeGatewayMac(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
        );

        expect(sensors2).toBeDefined();
        expect(sensors2.length).toBe(2); //we created 2 sensors

        //sort this list by sensorMac to make the test more reliable
        sensors2.sort((a, b) => a.sensorMac.localeCompare(b.sensorMac));

        expect(sensors2[0].sensorMac).toBe(sensor1.sensorMac);
        expect(sensors2[0].sensorName).toBe(sensor1.sensorName);
        expect(sensors2[0].sensorDescription).toBe(sensor1.sensorDescription);
        expect(sensors2[0].sensorVariable).toBe(sensor1.sensorVariable);
        expect(sensors2[0].sensorUnit).toBe(sensor1.sensorUnit);

        expect(sensors2[0].gateway).toBeUndefined(); //gateway is not loaded since we set eager to false

        expect(sensors2[1].sensorMac).toBe(sensor2.sensorMac);
        expect(sensors2[1].sensorName).toBe(sensor2.sensorName);
        expect(sensors2[1].sensorDescription).toBe(sensor2.sensorDescription);
        expect(sensors2[1].sensorVariable).toBe(sensor2.sensorVariable);
        expect(sensors2[1].sensorUnit).toBe(sensor2.sensorUnit);

        expect(sensors2[1].gateway).toBeUndefined(); //gateway is not loaded since we set eager to false


    });

    it("get all sensors by networkCode and gatewayMac - not found error (gatewayMac not found)", async () => {
        //create a first sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor1 = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor1).toBeDefined();
        expect(sensor1.sensorMac).toBe("00:00:00:00:00:02");
        expect(sensor1.gateway).toBeDefined();
        expect(sensor1.gateway.gatewayMac).toBe(alreadyCreatedGateway.gatewayMac);


        //create a second sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor2 = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:03",
            "sensorName",
            "sensorDescription",
            "humidity",
            "g/kg"
        );

        expect(sensor2).toBeDefined();
        expect(sensor2.sensorMac).toBe("00:00:00:00:00:03");
        expect(sensor2.gateway).toBeDefined();
        expect(sensor2.gateway.gatewayMac).toBe(alreadyCreatedGateway.gatewayMac);


        //now get all sensors by networkCode and gatewayMac but using a non-existing gatewayMac and check it throws a NotFoundError
        await expect(async () => {
            await sensorRepo.getAllSensorsByNetworkCodeGatewayMac(
                alreadyCreatedNetwork.networkCode,
                "99:99:99:99:99:99", //non-existing gatewayMac
            );
        }).rejects.toThrow(NotFoundError);

    });

    it("get all sensors by networkCode and gatewayMac - not found error (networkCode not found)", async () => {
        //create a first sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor1 = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor1).toBeDefined();
        expect(sensor1.sensorMac).toBe("00:00:00:00:00:02");
        expect(sensor1.gateway).toBeDefined();
        expect(sensor1.gateway.gatewayMac).toBe(alreadyCreatedGateway.gatewayMac);


        //create a second sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor2 = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:03",
            "sensorName",
            "sensorDescription",
            "humidity",
            "g/kg"
        );

        expect(sensor2).toBeDefined();
        expect(sensor2.sensorMac).toBe("00:00:00:00:00:03");
        expect(sensor2.gateway).toBeDefined();
        expect(sensor2.gateway.gatewayMac).toBe(alreadyCreatedGateway.gatewayMac);


        //now get all sensors by networkCode and gatewayMac but using a non-existing networkCode and check it throws a NotFoundError
        await expect(async () => {
            await sensorRepo.getAllSensorsByNetworkCodeGatewayMac(
                "nonExistingNetworkCode", //non-existing networkCode
                alreadyCreatedGateway.gatewayMac
            );
        }).rejects.toThrow(NotFoundError);

    });

    it("get all sensor", async () => {
        //create another gateway to simulate multiple gateways in the same network
        const gatewayRepo = new GatewayRepository();
        const savedGateway2 = await gatewayRepo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "00:00:00:00:00:02",
            "gatewayName2",
            "gatewayDescription2"
        );

        expect(savedGateway2).toBeDefined();
        expect(savedGateway2.gatewayMac).toBe("00:00:00:00:00:02");


        //create a first sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor1 = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:03",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor1).toBeDefined();
        expect(sensor1.sensorMac).toBe("00:00:00:00:00:03");
        expect(sensor1.gateway).toBeDefined();
        expect(sensor1.gateway.gatewayMac).toBe(alreadyCreatedGateway.gatewayMac);

        //create a second sensor attached to the gateway created in this function, which is attached to the network created in the beforeEach
        const sensor2 = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            savedGateway2.gatewayMac,
            "00:00:00:00:00:04",
            "sensorName",
            "sensorDescription",
            "humidity",
            "g/kg"
        );
        expect(sensor2).toBeDefined();
        expect(sensor2.sensorMac).toBe("00:00:00:00:00:04");
        expect(sensor2.gateway).toBeDefined();
        expect(sensor2.gateway.gatewayMac).toBe(savedGateway2.gatewayMac);


        //now retrieve all sensors in the database, for all networks and gateways
        const sensors = await sensorRepo.getAllSensors(true); //eager load the gateway and relation to test it
        //sort this list by sensorMac to make the test more reliable
        sensors.sort((a, b) => a.sensorMac.localeCompare(b.sensorMac));
        //now sensor[0] should have MAC 00:00:00:00:00:03 and sensor[1] should have MAC 00:00:00:00:00:04
        expect(sensors).toBeDefined();
        expect(sensors.length).toBe(2); //we created 2 sensors in the same gateway

        //test sensor with MAC address 00:00:00:00:00:03 is attached to the gateway created in the beforeEach
        expect(sensors[0]).toBeDefined();
        expect(sensors[0].sensorMac).toBe(sensor1.sensorMac);
        expect(sensors[0].gateway).toBeDefined();
        expect(sensors[0].gateway.gatewayMac).toBe(alreadyCreatedGateway.gatewayMac);

        //test sensor with MAC address 00:00:00:00:00:04 is attached to the gateway created in this function
        expect(sensors[1]).toBeDefined();
        expect(sensors[1].sensorMac).toBe(sensor2.sensorMac);
        expect(sensors[1].gateway).toBeDefined();
        expect(sensors[1].gateway.gatewayMac).toBe(savedGateway2.gatewayMac);


    });

    it("get all sensors - empty list", async () => {
        //there are no sensors in the database yet, so we expect an empty list
        const sensors = await sensorRepo.getAllSensors(); 

        expect(sensors).toBeDefined();
        expect(sensors.length).toBe(0); //no sensors created yet

    });

    it("update sensor", async () => {   
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");

        //update the sensor
        //change sensorMac
        const sensorUpdate: Partial<SensorDAO> = {
            sensorMac: "00:00:00:00:00:10"
        };

        await sensorRepo.updateSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            sensor.sensorMac,
            sensorUpdate
        );

        //get the sensor by networkCode, gatewayMac and the new sensorMac defined in sensorUpdate
        const retrievedSensor = await sensorRepo.getSensorByNetworkCodeGatewayMacSensorMac(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            sensorUpdate.sensorMac
        );

        console.log("retrievedSensor1: ", retrievedSensor);

        expect(retrievedSensor).toBeDefined();
        expect(retrievedSensor.sensorMac).toBe(sensorUpdate.sensorMac);
        expect(retrievedSensor.sensorName).toBe(sensor.sensorName);
        expect(retrievedSensor.sensorDescription).toBe(sensor.sensorDescription);
        expect(retrievedSensor.sensorVariable).toBe(sensor.sensorVariable);
        expect(retrievedSensor.sensorUnit).toBe(sensor.sensorUnit);

        //now update the sensor description and variable
        const sensorUpdate2: Partial<SensorDAO> = {
            sensorDescription: "newSensorDescription",
            sensorVariable: "weight"
        };

        await sensorRepo.updateSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            sensorUpdate.sensorMac,
            sensorUpdate2
        );

        //get the sensor by networkCode, gatewayMac and the new sensorMac defined in sensorUpdate
        const retrievedSensor2 = await sensorRepo.getSensorByNetworkCodeGatewayMacSensorMac(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            sensorUpdate.sensorMac
        );

        console.log("retrievedSensor2: ", retrievedSensor2);

        expect(retrievedSensor2).toBeDefined();
        expect(retrievedSensor2.sensorMac).toBe(sensorUpdate.sensorMac);
        expect(retrievedSensor2.sensorName).toBe(sensor.sensorName);
        expect(retrievedSensor2.sensorDescription).toBe(sensorUpdate2.sensorDescription);
        expect(retrievedSensor2.sensorVariable).toBe(sensorUpdate2.sensorVariable);
        expect(retrievedSensor2.sensorUnit).toBe(sensor.sensorUnit);

        //now update the sensor name and unit
        const sensorUpdate3: Partial<SensorDAO> = {
            sensorName: "newSensorName",
            sensorUnit: "kg"
        };
        await sensorRepo.updateSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            sensorUpdate.sensorMac,
            sensorUpdate3
        );

        //get the sensor by networkCode, gatewayMac and the new sensorMac defined in sensorUpdate
        const retrievedSensor3 = await sensorRepo.getSensorByNetworkCodeGatewayMacSensorMac(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            sensorUpdate.sensorMac
        );

        console.log("retrievedSensor3: ", retrievedSensor3);

        expect(retrievedSensor3).toBeDefined();
        expect(retrievedSensor3.sensorMac).toBe(sensorUpdate.sensorMac);
        expect(retrievedSensor3.sensorName).toBe(sensorUpdate3.sensorName);
        expect(retrievedSensor3.sensorDescription).toBe(sensorUpdate2.sensorDescription);
        expect(retrievedSensor3.sensorVariable).toBe(sensorUpdate2.sensorVariable);
        expect(retrievedSensor3.sensorUnit).toBe(sensorUpdate3.sensorUnit);

    });

    
    it("update sensor - conflict error", async () => {
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");

        //create a second sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor2 = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:03",
            "sensorName",
            "sensorDescription",
            "humidity",
            "g/kg"
        );

        expect(sensor2).toBeDefined();
        expect(sensor2.sensorMac).toBe("00:00:00:00:00:03");

        //try to update the first sensor with the MAC address of the second sensor and check it throws a ConflictError
        await expect(async () => {
            await sensorRepo.updateSensor(
                alreadyCreatedNetwork.networkCode,
                alreadyCreatedGateway.gatewayMac,
                sensor.sensorMac,
                { sensorMac: sensor2.sensorMac } //update
            );
        }).rejects.toThrow(ConflictError);


    });

    it("update sensor - not found error (sensorMac not found)", async () => {

        //try to update the sensor with a non-existing sensorMac and check it throws a NotFoundError
        await expect(async () => {
            await sensorRepo.updateSensor(
                alreadyCreatedNetwork.networkCode,
                alreadyCreatedGateway.gatewayMac,
                "99:99:99:99:99:99", //non-existing sensorMac
                { sensorMac: "00:00:00:00:00:10" } //update
            );
        }).rejects.toThrow(NotFoundError);

    });

    it("update sensor - not found error (gatewayMac not found)", async () => {
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");

        //try to update the sensor with a non-existing gatewayMac and check it throws a NotFoundError
        await expect(async () => {
            await sensorRepo.updateSensor(
                alreadyCreatedNetwork.networkCode,
                "99:99:99:99:99:99", //non-existing gatewayMac
                sensor.sensorMac,
                { sensorMac: "00:00:00:00:00:10" } //update
            );
        }).rejects.toThrow(NotFoundError);

    });

    it("update sensor - not found error (networkCode not found)", async () => {
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");

        //try to update the sensor with a non-existing networkCode and check it throws a NotFoundError
        await expect(
            sensorRepo.updateSensor(
                "nonExistingNetworkCode", // non-existing networkCode
                alreadyCreatedGateway.gatewayMac,
                "00:00:00:00:00:02",
                { sensorMac: "00:00:00:00:00:10" }
            )
        ).rejects.toThrow(NotFoundError);

    });

    it("update sensor - everything found but sensor doesn't belong to gateway", async () => {
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");

        //create a new gateway to simulate a sensor that doesn't belong to the gateway
        const gatewayRepo = new GatewayRepository();
        const savedGateway2 = await gatewayRepo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "00:00:00:00:00:30",
            "gatewayName2",
            "gatewayDescription2"
        );

        expect(savedGateway2).toBeDefined();
        expect(savedGateway2.gatewayMac).toBe("00:00:00:00:00:30");

        //try to update the sensor with a different gateway and check it throws a NotFoundError
        await expect(async () => {
            await sensorRepo.updateSensor(
                alreadyCreatedNetwork.networkCode,
                savedGateway2.gatewayMac, //sensor DOES NOT BELONG to this gateway!
                sensor.sensorMac,
                { sensorMac: "00:00:00:00:00:10" } //update
            );
        }).rejects.toThrow(NotFoundError);

    });

    it("update sensor - everything found but gateway doesn't belong to network", async () => {
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");

        //create a new network to simulate a gateway that doesn't belong to the network
        const networkRepo = new NetworkRepository();
        const savedNetwork2 = await networkRepo.createNetwork(
            "networkCode2",
            "networkName2",
            "networkDescription2"
        );


        expect(savedNetwork2).toBeDefined();
        expect(savedNetwork2.networkCode).toBe("networkCode2");

        //try to update the sensor with a different network and check it throws a NotFoundError
        await expect(async () => {
            await sensorRepo.updateSensor(
                savedNetwork2.networkCode, //sensor DOES NOT BELONG to this network!
                alreadyCreatedGateway.gatewayMac,
                sensor.sensorMac,
                { sensorMac: "00:00:00:00:00:10" } //update
            );
        }).rejects.toThrow(NotFoundError);

    });


    it("delete sensor", async () => {
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");

        //delete the sensor
        await sensorRepo.deleteSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            sensor.sensorMac
        );

        //try to get the sensor by networkCode, gatewayMac and sensorMac and check it throws a NotFoundError
        await expect(async () => {
            await sensorRepo.getSensorByNetworkCodeGatewayMacSensorMac(
                alreadyCreatedNetwork.networkCode,
                alreadyCreatedGateway.gatewayMac,
                sensor.sensorMac
            );
        }).rejects.toThrow(NotFoundError);

    });

    it("delete sensor - not found error (sensorMac not found)", async () => {
        //try to delete a sensor with a non-existing sensorMac and check it throws a NotFoundError
        await expect(async () => {
            await sensorRepo.deleteSensor(
                alreadyCreatedNetwork.networkCode,
                alreadyCreatedGateway.gatewayMac,
                "99:99:99:99:99:99" //non-existing sensorMac
            );
        }).rejects.toThrow(NotFoundError);

    });

    it("delete sensor - not found error (gatewayMac not found)", async () => {
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");

        //try to delete the sensor with a non-existing gatewayMac and check it throws a NotFoundError
        await expect(async () => {
            await sensorRepo.deleteSensor(
                alreadyCreatedNetwork.networkCode,
                "99:99:99:99:99:99", //non-existing gatewayMac
                sensor.sensorMac
            );
        }).rejects.toThrow(NotFoundError);

    });

    it("delete sensor - not found error (networkCode not found)", async () => {
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");

        //try to delete the sensor with a non-existing networkCode and check it throws a NotFoundError
        await expect(async () => {
            await sensorRepo.deleteSensor(
                "nonExistingNetworkCode", //non-existing networkCode
                alreadyCreatedGateway.gatewayMac,
                sensor.sensorMac
            );
        }).rejects.toThrow(NotFoundError);

    });

    it("delete sensor - everything found but sensor doesn't belong to gateway", async () => {
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");

        //create a new gateway to simulate a sensor that doesn't belong to the gateway
        const gatewayRepo = new GatewayRepository();
        const savedGateway2 = await gatewayRepo.createGateway(
            alreadyCreatedNetwork.networkCode,
            "00:00:00:00:00:30",
            "gatewayName2",
            "gatewayDescription2"
        );

        expect(savedGateway2).toBeDefined();
        expect(savedGateway2.gatewayMac).toBe("00:00:00:00:00:30");

        //try to delete the sensor with a different gateway and check it throws a NotFoundError
        await expect(async () => {
            await sensorRepo.deleteSensor(
                alreadyCreatedNetwork.networkCode,
                savedGateway2.gatewayMac, //sensor DOES NOT BELONG to this gateway!
                sensor.sensorMac
            );
        }).rejects.toThrow(NotFoundError);

    });

    it("delete sensor - everything found but sensor doesn't belong to network", async () => {
        //create a new sensor attached to the gateway created in the beforeEach, which is attached to the network created in the beforeEach
        const sensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            "00:00:00:00:00:02",
            "sensorName",
            "sensorDescription",
            "temperature",
            "C"
        );

        expect(sensor).toBeDefined();
        expect(sensor.sensorMac).toBe("00:00:00:00:00:02");
        //gateway created in the BeforeEach belongs to the network created in the beforeEach!!!!

        //create a new network to simulate a sensor that doesn't belong to the network
        const networkRepo = new NetworkRepository();
        const savedNetwork2 = await networkRepo.createNetwork(
            "networkCode2",
            "networkName2",
            "networkDescription2"
        );

        expect(savedNetwork2).toBeDefined();
        expect(savedNetwork2.networkCode).toBe("networkCode2");

        //try to delete the sensor with a different network and check it throws a NotFoundError
        await expect(async () => {
            await sensorRepo.deleteSensor(
                savedNetwork2.networkCode, //gateway DOES NOT BELONG to this network!
                alreadyCreatedGateway.gatewayMac,
                sensor.sensorMac
            );
        }).rejects.toThrow(NotFoundError);

    });
    
    


});
