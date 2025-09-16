import { GatewayRepository, MeasurementRepository, NetworkRepository, SensorRepository } from "@repositories/index";
import {
    initializeTestDataSource,
    closeTestDataSource,
    TestDataSource
  } from "@test/setup/test-datasource";
import { MeasurementDAO, GatewayDAO, NetworkDAO, SensorDAO } from "@dao/index";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";


const alreadyCreatedNetwork = {
    networkCode: "networkCode1",
    networkName: "networkName",
    networkDescription: "networkDescription",
};

const alreadyCreatedGateway = {
    gatewayMac: "gatewayMac1",
    gatewayName: "gatewayName",
    gatewayDescription: "gatewayDescription",
}

const alreadyCreatedSensor = {
    sensorMac: "sensorMac1",
    sensorName: "sensorName",
    sensorDescription: "sensorDescription",
    sensorVariable: "sensorVariable",
    sensorUnit: "sensorUnit",
}


beforeAll(async () => {
    await initializeTestDataSource();
});

afterAll(async () => {
    await closeTestDataSource();
});


describe.only("MeasurementRepository: SQLite in-memory", () => {
    const repo = new MeasurementRepository();

    let savedNetwork: any;
    let savedGateway: any;
    let savedSensor: any;
    let networkRepo: NetworkRepository;
    let gatewayRepo: GatewayRepository;
    let sensorRepo: SensorRepository;

    beforeEach(async () => {
        await TestDataSource.getRepository(MeasurementDAO).clear();
        await TestDataSource.getRepository(SensorDAO).clear();
        await TestDataSource.getRepository(GatewayDAO).clear();
        await TestDataSource.getRepository(NetworkDAO).clear();
    
        // Create a network, gateway, and sensor for testing
        networkRepo = new NetworkRepository();
        savedNetwork = await networkRepo.createNetwork(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedNetwork.networkName,
            alreadyCreatedNetwork.networkDescription
        );
    
        gatewayRepo = new GatewayRepository();
        savedGateway = await gatewayRepo.createGateway(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            alreadyCreatedGateway.gatewayName,
            alreadyCreatedGateway.gatewayDescription,
        );
        savedGateway = await TestDataSource.getRepository(GatewayDAO).findOne({
            where: { gatewayMac: alreadyCreatedGateway.gatewayMac },
            relations: ["network"],
        });

    
        sensorRepo = new SensorRepository();
        savedSensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            alreadyCreatedSensor.sensorMac,
            alreadyCreatedSensor.sensorName,
            alreadyCreatedSensor.sensorDescription,
            alreadyCreatedSensor.sensorVariable,
            alreadyCreatedSensor.sensorUnit,
        );
        savedSensor = await TestDataSource.getRepository(SensorDAO).findOne({
            where: { sensorMac: alreadyCreatedSensor.sensorMac },
            relations: ["gateway", "gateway.network"],
        });
    
    });
    
    it("create measurement", async () => {
        let newMeasurement = await repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, new Date("2025-05-01T12:00:00Z"), 1);

        expect(newMeasurement).toMatchObject({
            value: 1,
            createdAt: new Date("2025-05-01T12:00:00Z"),
            sensor: savedSensor
        });

        //check if the measurement is saved in the db
        const foundMeasurement = await repo.getMeasurementsByNetworkAndSensors(alreadyCreatedNetwork.networkCode, [alreadyCreatedSensor.sensorMac], undefined, undefined);

        expect(foundMeasurement).toMatchObject(
            [{
                createdAt: new Date("2025-05-01T12:00:00Z"),
                value: 1,
                //since gateway is not eagerly loaded, sensor will have undefined gateway
                sensor: {...savedSensor, gateway: undefined}
            }]
        )
           
        const foundMeasurement2 = await repo.getMeasurementsBySensor(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, undefined, undefined);
        
        expect(foundMeasurement2).toMatchObject(
            [{
                createdAt: new Date("2025-05-01T12:00:00Z"),
                value: 1,
                sensor: savedSensor
            }]
        )
    });

    it("create measurement: not found", async () => {
        // Test with a non-existent sensor
        await expect(repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, "ghostSensor", new Date("2025-05-01T12:00:00Z"), 1)).rejects.toThrow(NotFoundError);
    });

    it("create measurement: not found", async () => {
        // Test with a non-existent gateway
        await expect(repo.createMeasurement(alreadyCreatedNetwork.networkCode, "ghostGateway", alreadyCreatedSensor.sensorMac, new Date("2025-05-01T12:00:00Z"), 1)).rejects.toThrow(NotFoundError);
    });

    it("create measurement: not found", async () => {
        // Test with a non-existent network
        await expect(repo.createMeasurement("ghostNetwork", alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, new Date("2025-05-01T12:00:00Z"), 1)).rejects.toThrow(NotFoundError);
    });

    //da implementare nel repository
    /*it("create measurement: conflict", async () => {
        // Create a measurement first
        await repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, new Date("2025-05-01T12:00:00Z"), 1);
        
        // Try to create a measurement with the same timestamp and sensor
        await expect(repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, new Date("2025-05-01T12:00:00Z"), 1)).rejects.toThrow(ConflictError);
    });*/

    it("getMeasurementsByNetworkAndSensors: filter by sensorMacs", async () => {
        await repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, new Date("2025-05-01T10:00:00Z"), 5);
        await repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, new Date("2025-05-01T11:00:00Z"), 10);
       // creating a second sensor
       const secondSensor = await sensorRepo.createSensor(
        alreadyCreatedNetwork.networkCode,
        alreadyCreatedGateway.gatewayMac,       
        "sensorMac2",  
        "sensorName2",
        "sensorDescription2",       
        "sensorVariable2",
        "sensorUnit2"
    );
        await repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, "sensorMac2", new Date("2025-05-01T12:00:00Z"), 15);

        const result = await repo.getMeasurementsByNetworkAndSensors(alreadyCreatedNetwork.networkCode, [alreadyCreatedSensor.sensorMac]);
        expect(result).toHaveLength(2);
        expect(result.every(m => m.sensor.sensorMac === savedSensor.sensorMac)).toBe(true);
    });

    it("getMeasurementsByNetworkAndSensors: filter by startDate and endDate", async () => {
        await repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, new Date("2025-05-01T09:00:00Z"), 1); // outside
        await repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, new Date("2025-05-01T12:00:00Z"), 2); // inside
        await repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, new Date("2025-05-01T15:00:00Z"), 3); // inside
        await repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, new Date("2025-05-01T18:00:00Z"), 4); // outside
    
        const result = await repo.getMeasurementsByNetworkAndSensors(
            alreadyCreatedNetwork.networkCode,
            [alreadyCreatedSensor.sensorMac],
            new Date("2025-05-01T11:00:00Z"),
            new Date("2025-05-01T16:00:00Z")
        );
    
        expect(result).toHaveLength(2);
        expect(result.map(m => m.value)).toEqual([2, 3]);
    });

    it("getMeasurementsByNetworkAndSensors: empty result with filters", async () => {
        await repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, new Date("2025-05-01T10:00:00Z"), 1);
    
        // Date range without results
        const res = await(
            repo.getMeasurementsByNetworkAndSensors(
                alreadyCreatedNetwork.networkCode,
                [alreadyCreatedSensor.sensorMac],
                new Date("2025-05-02T00:00:00Z"),
                new Date("2025-05-03T00:00:00Z")
            )
        )

        expect(res).toHaveLength(0);
        expect(res).toEqual([]);
    });

    it("get measurements by network and sensors - not found", async () => {
        // Test with a non-existent network
        await expect(repo.getMeasurementsByNetworkAndSensors("ghostNetwork", [alreadyCreatedSensor.sensorMac], undefined, undefined)).rejects.toThrow(NotFoundError);
    });

    it("getMeasurementsByNetworkAndSensors: no sensorMacs parameter returns all sensors' measurements", async () => {
        // creating a second sensor
        const secondSensor = await sensorRepo.createSensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,       
            "sensorMac2",  
            "sensorName2",
            "sensorDescription2",       
            "sensorVariable2",
            "sensorUnit2"
        );
    
        await repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, new Date("2025-05-01T10:00:00Z"), 10);
        await repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, secondSensor.sensorMac, new Date("2025-05-01T11:00:00Z"), 20);

        const results = await repo.getMeasurementsByNetworkAndSensors(alreadyCreatedNetwork.networkCode);
    
        expect(results).toHaveLength(2);
        const values = results.map(m => m.value);
        expect(values).toContain(10);
        expect(values).toContain(20);
    });

    it("get measurements by sensor - not found", async () => {
        // Test with a non-existent sensor
        await expect(repo.getMeasurementsBySensor(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, "ghostSensor", undefined, undefined)).rejects.toThrow(NotFoundError);
        // Test with a non-existent gateway
        await expect(repo.getMeasurementsBySensor(alreadyCreatedNetwork.networkCode, "ghostGateway", alreadyCreatedSensor.sensorMac, undefined, undefined)).rejects.toThrow(NotFoundError);
        // Test with a non-existent network
        await expect(repo.getMeasurementsBySensor("ghostNetwork", alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, undefined, undefined)).rejects.toThrow(NotFoundError);
    }
    );

    it("getMeasurementsBySensor: filters by date range", async () => {
        await repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, new Date("2025-05-01T09:00:00Z"), 5); // outside
        await repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, new Date("2025-05-01T10:00:00Z"), 10); // inside
        await repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, new Date("2025-05-01T11:00:00Z"), 15); // inside
        await repo.createMeasurement(alreadyCreatedNetwork.networkCode, alreadyCreatedGateway.gatewayMac, alreadyCreatedSensor.sensorMac, new Date("2025-05-01T12:00:00Z"), 20); // outside
    
        const results = await repo.getMeasurementsBySensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            alreadyCreatedSensor.sensorMac,
            new Date("2025-05-01T10:00:00Z"),
            new Date("2025-05-01T11:30:00Z")
        );
    
        expect(results).toHaveLength(2);
        expect(results.map(m => m.value)).toEqual([10, 15]);
    });

    it("getMeasurementsBySensor: throws if no measurements found", async () => {
        const res = await repo.getMeasurementsBySensor(
            alreadyCreatedNetwork.networkCode,
            alreadyCreatedGateway.gatewayMac,
            alreadyCreatedSensor.sensorMac,
            new Date("2030-01-01T00:00:00Z"),
            new Date("2030-01-02T00:00:00Z")
        );

        //it should return an empty array
        expect(res).toHaveLength(0);
        expect(res).toEqual([]);
    });


});
    
