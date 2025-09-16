import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import {
    beforeAllE2e,
    afterAllE2e,
    TEST_USERS,
    TEST_NETWORKS,
    TEST_MEASUREMENTS,
    TEST_SENSORS
} from "@test/e2e/lifecycle";
import { CONFIG } from "@config";

describe(`GET - ${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/measurements`, () => {
    let tokenAdmin: string;
    let tokenOperator: string;
    let tokenViewer: string;

    beforeAll(async () => {
        await beforeAllE2e();
        tokenAdmin = generateToken(TEST_USERS.admin);
        tokenOperator = generateToken(TEST_USERS.operator);
        tokenViewer = generateToken(TEST_USERS.viewer);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("get measurements for a network - Admin", async () => {
        const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/measurements`.replace(":networkCode", TEST_NETWORKS.network1.networkCode);

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(TEST_SENSORS.length_NET1); //for each sensor we receive a measurementsDTO

        console.log("Measurements response body:", response.body);

        const m1 = response.body.find(m => m.sensorMacAddress === TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        expect(m1).toBeDefined();
        expect(m1.measurements).toHaveLength(TEST_MEASUREMENTS.length_NET1_gateway1_sensor1);

        const m2 = response.body.find(m => m.sensorMacAddress === TEST_SENSORS.sensor2_gateway1_Net1.sensorMac);
        expect(m2).toBeDefined();
        expect(m2.measurements).toHaveLength(TEST_MEASUREMENTS.length_NET1_gateway1_sensor2);

        const m3 = response.body.find(m => m.sensorMacAddress === TEST_SENSORS.sensor1_gateway2_Net1.sensorMac);
        expect(m3).toBeDefined();
        
        //MEASUREMENTS_SENSOR1_GATEWAY1_NET1
        //sort measurements of m1 by value, ascending
        console.log("Measurements for sensor1_gateway1_Net1:", m1);
        m1.measurements.sort((a, b) => a.value - b.value);
        //now first one is measurement1_sensor1_gateway1_Net1, the second one is measurement2_sensor1_gateway1_Net1 and so on
        expect(m1.measurements[0].value).toBe(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.value);
        expect(new Date(m1.measurements[0].createdAt)).toEqual(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.createdAt);
        
        expect(m1.measurements[1].value).toBe(TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.value);
        expect(new Date(m1.measurements[1].createdAt)).toEqual(TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.createdAt);
        
        expect(m1.measurements[2].value).toBe(TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.value);
        expect(new Date(m1.measurements[2].createdAt)).toEqual(TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.createdAt);
    
        //MEASUREMENTS_SENSOR2_GATEWAY1_NET1
        //just one measurement
        expect(m2.measurements[0].value).toBe(TEST_MEASUREMENTS.measurement1_sensor2_gateway1_Net1.value);
        expect(new Date(m2.measurements[0].createdAt)).toEqual(TEST_MEASUREMENTS.measurement1_sensor2_gateway1_Net1.createdAt);
        
        //MEASUREMENTS_SENSOR1_GATEWAY2_NET1
        //expect zero measurements
        expect(m3).not.toHaveProperty('measurements');
        expect(m3).toMatchObject({
            sensorMacAddress: TEST_SENSORS.sensor1_gateway2_Net1.sensorMac
        });
    });

    it("get measurements for network - Operator", async () => {
    const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/measurements`.replace(
      ":networkCode",
      TEST_NETWORKS.network2.networkCode
    );

    const response = await request(app)
      .get(url)
      .set("Authorization", `Bearer ${tokenOperator}`);

    expect(response.status).toBe(200);
    console.log("Measurements response body - GET MEASUREMENTS FOR NETWORK:", response.body);
    expect(response.body).toBeDefined();
    expect(response.body).toHaveLength(TEST_SENSORS.length_NET2); //for each sensor we receive a measurementsDTO

    const m1 = response.body.find(m => m.sensorMacAddress === TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net2.sensorMac);
    expect(m1).toBeDefined();
    expect(m1.measurements).toHaveLength(TEST_MEASUREMENTS.length_NET2_gateway1_sensor1);

    expect(m1.measurements[0].value).toBe(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net2.value);
    expect(new Date(m1.measurements[0].createdAt)).toEqual(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net2.createdAt);
    
    //all the other two object just have the sensorMacAddress property
    const m2 = response.body.find(m => m.sensorMacAddress === TEST_SENSORS.sensor2_gateway1_Net2.sensorMac);
    expect(m2).toBeDefined();
    expect(m2).toMatchObject({
        sensorMacAddress: TEST_SENSORS.sensor2_gateway1_Net2.sensorMac
    });

    const m3 = response.body.find(m => m.sensorMacAddress === TEST_SENSORS.sensor3_gateway1_Net2.sensorMac);
    expect(m3).toBeDefined();
    expect(m3).toMatchObject({
        sensorMacAddress: TEST_SENSORS.sensor3_gateway1_Net2.sensorMac
    });

});

    it("get measurements for network - Viewer", async () => {
        const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/measurements`.replace(
        ":networkCode",
        TEST_NETWORKS.network3.networkCode
        );

        const response = await request(app)
        .get(url)
        .set("Authorization", `Bearer ${tokenViewer}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveLength(TEST_SENSORS.length_NET3); //for each sensor we receive a measurementsDTO
        //zero measurements for NET3: the response should be an empty array
        expect(response.body).toEqual([]);
        
    });

    it("get measurements for a network - invalid input data", async () => {
            const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/measurements`.replace(":networkCode", TEST_NETWORKS.network1.networkCode);

            const invalidStartDate = "not-a-date";
            const response = await request(app)
            .get(url)
            .query({ startDate: invalidStartDate })
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .set("Accept", "application/json");

            expect(response.status).toBe(400);
            expect(response.headers['content-type']).toMatch(/application\/json/);

            expect(response.body).toMatchObject({
                code: 400,
                name: "Bad Request",
                message: expect.stringContaining("startDate must match format"),
            });
        });

    it("get measurements for network - Unauthorized", async () => {
        const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/measurements`.replace(
        ":networkCode",
        TEST_NETWORKS.network1.networkCode
        );

        const response = await request(app)
        .get(url);

        expect(response.status).toBe(401);
        expect(response.body).toBeDefined();

        const response2 = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}invalid_or_expired`);
        
            expect(response2.status).toBe(401);
            expect(response2.body).toBeDefined();
            expect(response2.body.message).toMatch(/Unauthorized/);

    });

    it("get measurements for network - 404 Not Found", async () => {
            const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/measurements`.replace(":networkCode", "non_existing_network_code");
    
            const response = await request(app)
                .get(url)
                .set("Authorization", `Bearer ${tokenAdmin}`);
    
            expect(response.status).toBe(404);
            expect(response.body).toBeDefined();
            expect(response.body.message).toMatch("Entity with code 'non_existing_network_code' not found");
        });
    
    it("get measurements for network - empty network", async () => {
           //NET03 is empty
            const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/measurements`.replace(":networkCode", TEST_NETWORKS.network3.networkCode);
    
            const response = await request(app)
                .get(url)
                .set("Authorization", `Bearer ${tokenAdmin}`);
    
            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body).toHaveLength(0); //0 measurements
        });
});

describe(`GET - ${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/stats`, () => {
    let tokenAdmin: string;
    let tokenOperator: string;
    let tokenViewer: string;

    beforeAll(async () => {
        await beforeAllE2e();
        tokenAdmin = generateToken(TEST_USERS.admin);
        tokenOperator = generateToken(TEST_USERS.operator);
        tokenViewer = generateToken(TEST_USERS.viewer);
    });

    afterAll(async () => {
        await afterAllE2e();
    });
    const networkCode = TEST_NETWORKS.network1.networkCode;
    const buildUrl = (code = networkCode) =>
        `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/stats`.replace(':networkCode', code);

    it("get stats for network - Admin ", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(TEST_SENSORS.length_NET1); 

        console.log("Stats response body:", response.body);
        const m1 = response.body.find(m => m.sensorMacAddress === TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.sensorMac);
        expect(m1).toBeDefined();
        expect(m1.stats).toBeDefined();
        const stat = m1.stats;
        expect(stat).toHaveProperty('mean');
        expect(stat).toHaveProperty('variance');
        expect(stat).toHaveProperty('upperThreshold');
        expect(stat).toHaveProperty('lowerThreshold');
        const computeMean = (TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.value + TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.value + TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.value) / 3;
        expect(stat.mean).toBeCloseTo(computeMean, 4); 
        const computeVariance = ((Math.pow(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.value - computeMean, 2) + Math.pow(TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.value - computeMean, 2) + Math.pow(TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.value - computeMean, 2)) / 3);
        expect(stat.variance).toBeCloseTo(computeVariance, 4);
        expect(stat.upperThreshold).toBeCloseTo(stat.mean + 2 * Math.sqrt(stat.variance), 4);
        expect(stat.lowerThreshold).toBeCloseTo(stat.mean - 2 * Math.sqrt(stat.variance), 4);
    });

    it("get stats for network - Operator ", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenOperator}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(TEST_SENSORS.length_NET1);

        const m1 = response.body.find(m => m.sensorMacAddress === TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.sensorMac);
        expect(m1).toBeDefined();
        expect(m1.stats).toBeDefined();
        const stat = m1.stats;
        expect(stat).toHaveProperty('mean');
        expect(stat).toHaveProperty('variance');
        expect(stat).toHaveProperty('upperThreshold');
        expect(stat).toHaveProperty('lowerThreshold');
        const computeMean = (TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.value + TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.value + TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.value) / 3;
        expect(stat.mean).toBeCloseTo(computeMean, 4); 
        const computeVariance = ((Math.pow(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.value - computeMean, 2) + Math.pow(TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.value - computeMean, 2) + Math.pow(TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.value - computeMean, 2)) / 3);
        expect(stat.variance).toBeCloseTo(computeVariance, 4);
        expect(stat.upperThreshold).toBeCloseTo(stat.mean + 2 * Math.sqrt(stat.variance), 4);
        expect(stat.lowerThreshold).toBeCloseTo(stat.mean - 2 * Math.sqrt(stat.variance), 4);
    });

    it("get stats for network - Viewer ", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenViewer}`);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(TEST_SENSORS.length_NET1);

        const m1 = response.body.find(m => m.sensorMacAddress === TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.sensorMac);
        expect(m1).toBeDefined();
        expect(m1.stats).toBeDefined();
        const stat = m1.stats;
        expect(stat).toHaveProperty('mean');
        expect(stat).toHaveProperty('variance');
        expect(stat).toHaveProperty('upperThreshold');
        expect(stat).toHaveProperty('lowerThreshold');
        const computeMean = (TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.value + TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.value + TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.value) / 3;
        expect(stat.mean).toBeCloseTo(computeMean, 4); 
        const computeVariance = ((Math.pow(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.value - computeMean, 2) + Math.pow(TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.value - computeMean, 2) + Math.pow(TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.value - computeMean, 2)) / 3);
        expect(stat.variance).toBeCloseTo(computeVariance, 4);
        expect(stat.upperThreshold).toBeCloseTo(stat.mean + 2 * Math.sqrt(stat.variance), 4);
        expect(stat.lowerThreshold).toBeCloseTo(stat.mean - 2 * Math.sqrt(stat.variance), 4);

    });

    it("get stats for network - invalid input data", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .query({ startDate: "invalid-date" })
            .set("Authorization", `Bearer ${tokenAdmin}`)

        expect(response.status).toBe(400);
        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(response.body).toBeDefined();
    });

    it("get stats for network - invalid input data", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .query({
                endDate: "bad-end-date"
            })
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .set("Accept", "application/json");

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            code: 400,
            name: "Bad Request",
            message: expect.stringContaining("endDate must match format"),
        });
    });

    it("get stats for network - Unauthorized ", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url);

        expect(response.status).toBe(401);
        expect(response.body).toBeDefined();
    });

    it("get stats for network - Unauthorized ", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer invalid.token.here`);

        expect(response.status).toBe(401);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("get stats for network - 404 Not Found", async () => {
        const url = buildUrl("non_existing_network_code");

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Entity with code .* found/);
    });

    it("get stats for network - empty network (no measurements)", async () => {
        const url = buildUrl(TEST_NETWORKS.network3.networkCode);

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveLength(0);
    });

});

describe(`GET - ${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/outliers`, () => {
    let tokenAdmin: string;
    let tokenOperator: string;
    let tokenViewer: string;

    beforeAll(async () => {
        await beforeAllE2e();
        tokenAdmin = generateToken(TEST_USERS.admin);
        tokenOperator = generateToken(TEST_USERS.operator);
        tokenViewer = generateToken(TEST_USERS.viewer);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("get outlier measurements - Admin", async () => {
        const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/outliers`.replace(":networkCode", TEST_NETWORKS.network1.networkCode);

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

        const m1 = response.body.find(
            (m) => m.sensorMacAddress === TEST_SENSORS.sensor1_gateway1_Net1.sensorMac
        );

        expect(m1).toBeDefined();
        expect(m1.stats).toBeDefined();
        expect(m1.stats.mean).toEqual(expect.any(Number));
        expect(m1.stats.variance).toEqual(expect.any(Number));

        expect(m1.measurements).toBeDefined();
        expect(Array.isArray(m1.measurements)).toBe(true);

        for (const meas of m1.measurements) {
            expect(meas.isOutlier).toBe(true);
        }
    });

    it("get outlier measurements - Operator", async () => {
        const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/outliers`.replace(":networkCode", TEST_NETWORKS.network1.networkCode);

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenOperator}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
    });

    it("get outlier measurements - Viewer", async () => {
        const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/outliers`.replace(":networkCode", TEST_NETWORKS.network1.networkCode);

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenViewer}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
    });

    it("get outlier measurements - invalid input data", async () => {
        const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/outliers`.replace(":networkCode", TEST_NETWORKS.network1.networkCode);

        const response = await request(app)
            .get(url)
            .query({ startDate: "not-a-date" })
            .set("Authorization", `Bearer ${tokenAdmin}`)

        expect(response.status).toBe(400);
        expect(response.headers["content-type"]).toMatch(/application\/json/);
        expect(response.body).toMatchObject({
            code: 400,
            name: "Bad Request",
            message: expect.stringContaining("startDate must match format")
        });
    });

    it("get outlier measurements - Unauthorized", async () => {
        const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/outliers`.replace(":networkCode", TEST_NETWORKS.network1.networkCode);

        const response = await request(app).get(url);

        expect(response.status).toBe(401);
        expect(response.body).toBeDefined();

        const response2 = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}invalid`);

        expect(response2.status).toBe(401);
        expect(response2.body).toBeDefined();
        expect(response2.body.message).toMatch(/Unauthorized/);
    });

    it("get outlier measurements - 404 Not Found", async () => {
        const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/outliers`.replace(":networkCode", "non_existing_network");

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch("Entity with code 'non_existing_network' not found");
    });

    it("get outlier measurements - empty network", async () => {
        const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/outliers`.replace(":networkCode", TEST_NETWORKS.network3.networkCode);

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(0);
    });
});

describe(`POST - ${CONFIG.ROUTES.V1_SENSORS}/:sensorMac/measurements`, () => {
    let tokenAdmin: string;
    let tokenOperator: string;
    let tokenViewer: string;

    beforeAll(async () => {
        await beforeAllE2e();
        tokenAdmin = generateToken(TEST_USERS.admin);
        tokenOperator = generateToken(TEST_USERS.operator);
        tokenViewer = generateToken(TEST_USERS.viewer);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    const validMeasurementPayload = [
        {
            createdAt: "2025-02-18T17:00:00+01:00",
            value: 1.8567
        }
    ];

    const sensorMac = "AA:BB:CC:DD:CC:01"

    const buildUrl = (sensor, gateway, network) =>
        `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac/measurements`.replace(':sensorMac', sensor).replace(":gatewayMac", gateway).replace(":networkCode", network);


    it("store measurement - Admin", async () => {
        const url = buildUrl(
            TEST_SENSORS.sensor1_gateway1_Net1.sensorMac, 
            TEST_SENSORS.sensor1_gateway1_Net1.gatewayMac,
            TEST_SENSORS.sensor1_gateway1_Net1.networkCode  
        );

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(validMeasurementPayload);

        expect(response.status).toBe(201);
    });

    it("store measurement - Operator", async () => {
        const url = buildUrl(
            TEST_SENSORS.sensor1_gateway1_Net1.sensorMac, 
            TEST_SENSORS.sensor1_gateway1_Net1.gatewayMac,
            TEST_SENSORS.sensor1_gateway1_Net1.networkCode
        );

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenOperator}`)
            .send(validMeasurementPayload);

        expect(response.status).toBe(201);
    });

    it("store measurement - Viewer (forbidden)", async () => {
        const url = buildUrl(
            TEST_SENSORS.sensor1_gateway1_Net1.sensorMac, 
            TEST_SENSORS.sensor1_gateway1_Net1.gatewayMac,
            TEST_SENSORS.sensor1_gateway1_Net1.networkCode
        );

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenViewer}`)
            .send(validMeasurementPayload);

        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("store measurement - Unauthorized", async () => {
        const url = buildUrl(
            TEST_SENSORS.sensor1_gateway1_Net1.sensorMac, 
            TEST_SENSORS.sensor1_gateway1_Net1.gatewayMac,
            TEST_SENSORS.sensor1_gateway1_Net1.networkCode
        );

        const response = await request(app)
            .post(url)
            .send(validMeasurementPayload);

        expect(response.status).toBe(401);
    });

    it("store measurement - Invalid input data", async () => {
        const url = buildUrl(
            TEST_SENSORS.sensor1_gateway1_Net1.sensorMac, 
            TEST_SENSORS.sensor1_gateway1_Net1.gatewayMac,
            TEST_SENSORS.sensor1_gateway1_Net1.networkCode
        );

        const invalidPayload = [
            {
                createdAt: "not-a-date",
                // missing value
            }
        ];

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(invalidPayload);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            code: 400,
            name: "Bad Request",
            message: expect.stringContaining("must have required property")
        });
    });

    it("store measurement - Not found (invalid network)", async () => {
         const url = buildUrl(
            "ghost", 
            TEST_SENSORS.sensor1_gateway1_Net1.gatewayMac,
            TEST_SENSORS.sensor1_gateway1_Net1.networkCode
        );
        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(validMeasurementPayload);

        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/Entity not found/);
    });

    it("store measurement - Not found (invalid gateway)", async () => {
        const url = buildUrl(
            TEST_SENSORS.sensor1_gateway1_Net1.sensorMac, 
            "ghost",
            TEST_SENSORS.sensor1_gateway1_Net1.networkCode
        );

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(validMeasurementPayload);

        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/Entity not found/);
    });

    it("store measurement - Not found (invalid sensor)", async () => {
         const url = buildUrl(
            "ghost",
            TEST_SENSORS.sensor1_gateway1_Net1.gatewayMac,
            TEST_SENSORS.sensor1_gateway1_Net1.networkCode
        );

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(validMeasurementPayload);

        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/Entity not found/);
    });
});

describe(`GET - ${CONFIG.ROUTES.V1_SENSORS}/:sensorMac/measurements`, () => {
  let tokenAdmin: string;
  let tokenOperator: string;
  let tokenViewer: string;

  const sensor = TEST_SENSORS.sensor1_gateway1_Net1.sensorMac;
  const gateway = TEST_SENSORS.sensor1_gateway1_Net1.gatewayMac;
  const network = TEST_NETWORKS.network1.networkCode;

  const baseUrl = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac/measurements`;

  beforeAll(async () => {
    await beforeAllE2e();
    tokenAdmin = generateToken(TEST_USERS.admin);
    tokenOperator = generateToken(TEST_USERS.operator);
    tokenViewer = generateToken(TEST_USERS.viewer);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  function urlWithParams() {
    return baseUrl
      .replace(":networkCode", network)
      .replace(":gatewayMac", gateway)
      .replace(":sensorMac", sensor);
  }

  it("get measurements for a sensor - Admin", async () => {
    const response = await request(app)
      .get(urlWithParams())
      .set("Authorization", `Bearer ${tokenAdmin}`);
      
    expect(response.status).toBe(200);
    console.log("Measurements response body - GET MEASUREMENTS OF SENSOR:", response.body);
    expect(response.body.sensorMacAddress).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
    expect(Array.isArray(response.body.measurements)).toBe(true);
    expect(response.body.stats).toBeDefined();
    expect(response.body.measurements).toHaveLength(TEST_MEASUREMENTS.length_NET1_gateway1_sensor1);

    //sort measurements by value, ascending
    response.body.measurements.sort((a, b) => a.value - b.value);
    //now first one is measurement1_sensor1_gateway1_Net1, the second one is measurement2_sensor1_gateway1_Net1 and so on
    expect(response.body.measurements[0].value).toBe(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.value);
    expect(new Date(response.body.measurements[0].createdAt)).toEqual(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.createdAt);
    expect(response.body.measurements[1].value).toBe(TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.value);
    expect(new Date(response.body.measurements[1].createdAt)).toEqual(TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.createdAt);
    expect(response.body.measurements[2].value).toBe(TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.value);
    expect(new Date(response.body.measurements[2].createdAt)).toEqual(TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.createdAt);


    });

  it("get measurements - Operator", async () => {
    const response = await request(app)
    .get(urlWithParams())
    .set("Authorization", `Bearer ${tokenOperator}`);

    expect(response.status).toBe(200);
    expect(response.body.sensorMacAddress).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
    expect(Array.isArray(response.body.measurements)).toBe(true);
    expect(response.body.stats).toBeDefined();

    //sort measurements by value, ascending
    response.body.measurements.sort((a, b) => a.value - b.value);
    //now first one is measurement1_sensor1_gateway1_Net1, the second one is measurement2_sensor1_gateway1_Net1 and so on
    expect(response.body.measurements[0].value).toBe(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.value);
    expect(new Date(response.body.measurements[0].createdAt)).toEqual(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.createdAt);
    expect(response.body.measurements[1].value).toBe(TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.value);
    expect(new Date(response.body.measurements[1].createdAt)).toEqual(TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.createdAt);
    expect(response.body.measurements[2].value).toBe(TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.value);
    expect(new Date(response.body.measurements[2].createdAt)).toEqual(TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.createdAt);
  });

  it("get measurements - Viewer", async () => {
    const response = await request(app)
      .get(urlWithParams())
      .set("Authorization", `Bearer ${tokenViewer}`);

    expect(response.status).toBe(200);
    expect(response.body.sensorMacAddress).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
    expect(Array.isArray(response.body.measurements)).toBe(true);
    expect(response.body.stats).toBeDefined();

    //sort measurements by value, ascending
    response.body.measurements.sort((a, b) => a.value - b.value);
    //now first one is measurement1_sensor1_gateway1_Net1, the second one is measurement2_sensor1_gateway1_Net1 and so on
    expect(response.body.measurements[0].value).toBe(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.value);
    expect(new Date(response.body.measurements[0].createdAt)).toEqual(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.createdAt);
    expect(response.body.measurements[1].value).toBe(TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.value);
    expect(new Date(response.body.measurements[1].createdAt)).toEqual(TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.createdAt);
    expect(response.body.measurements[2].value).toBe(TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.value);
    expect(new Date(response.body.measurements[2].createdAt)).toEqual(TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.createdAt);
  });

  it("get measurements - invalid startDate format", async () => {
    const response = await request(app)
      .get(urlWithParams())
      .query({ startDate: "invalid-date" })
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it("get measurements - unauthorized", async () => {
    const response = await request(app)
      .get(urlWithParams());

    expect(response.status).toBe(401);

    const response2 = await request(app)
      .get(urlWithParams())
      .set("Authorization", `Bearer ${tokenAdmin}corrotto`);

    expect(response2.status).toBe(401);
    expect(response2.body.message).toMatch(/Unauthorized/i);
  });

  it("get measurements - 404 sensor/gateway/network not found", async () => {
    const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac/measurements`
      .replace(":networkCode", "NONEXIST")
      .replace(":gatewayMac", "00:00:00:00:00:00")
      .replace(":sensorMac", "00:00:00:00:00:00");

    const response = await request(app)
      .get(url)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/Entity not found/);
  });

  it("get measurements - empty sensor", async () => {
    const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac/measurements`
      .replace(":networkCode", TEST_SENSORS.sensor1_gateway2_Net1.networkCode)
      .replace(":gatewayMac", TEST_SENSORS.sensor1_gateway2_Net1.gatewayMac)
      .replace(":sensorMac", TEST_SENSORS.sensor1_gateway2_Net1.sensorMac);

    const response = await request(app)
      .get(url)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    console.log("Response body for empty sensor:", response.body);

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.sensorMacAddress).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorMac);
    expect(response.body).not.toHaveProperty('measurements');
    expect(response.body).not.toHaveProperty('stats');
  });
});

describe(`GET - ${CONFIG.ROUTES.V1_SENSORS}/:sensorMac/stats`, () => {
    let tokenAdmin: string;
    let tokenOperator: string;
    let tokenViewer: string;

    const sensor = TEST_SENSORS.sensor1_gateway1_Net1;

    beforeAll(async () => {
        await beforeAllE2e();
        tokenAdmin = generateToken(TEST_USERS.admin);
        tokenOperator = generateToken(TEST_USERS.operator);
        tokenViewer = generateToken(TEST_USERS.viewer);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    const buildUrl = (sensorOverride = sensor) =>
        `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac/stats`
            .replace(":networkCode", sensorOverride.networkCode)
            .replace(":gatewayMac", sensorOverride.gatewayMac)
            .replace(":sensorMac", sensorOverride.sensorMac);

    it("get stats for sensor - Admin", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(200);
        console.log("Stats response body - GET STATS FOR A SENSOR:", response.body);
        expect(response.body).toMatchObject({
            mean: expect.any(Number),
            variance: expect.any(Number),
            upperThreshold: expect.any(Number),
            lowerThreshold: expect.any(Number),
        });
    });

    it("get stats for sensor - Operator", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenOperator}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            mean: expect.any(Number),
            variance: expect.any(Number),
            upperThreshold: expect.any(Number),
            lowerThreshold: expect.any(Number),
        });
    });

    it("get stats for sensor - Viewer", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenViewer}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            mean: expect.any(Number),
            variance: expect.any(Number),
            upperThreshold: expect.any(Number),
            lowerThreshold: expect.any(Number),
        });
    });

    it("get stats for sensor - invalid startDate", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .query({ startDate: "not-a-date" })
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            code: 400,
            name: "Bad Request",
            message: expect.stringContaining("startDate must match format"),
        });
    });

    it("get stats for sensor - invalid endDate", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .query({ endDate: "bad-date" })
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            code: 400,
            name: "Bad Request",
            message: expect.stringContaining("endDate must match format"),
        });
    });

    it("get stats for sensor - Unauthorized (no token)", async () => {
        const url = buildUrl();

        const response = await request(app).get(url);

        expect(response.status).toBe(401);
        expect(response.body).toBeDefined();
    });

    it("get stats for sensor - Unauthorized (bad token)", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .set("Authorization", "Bearer fake.token.here");

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("get stats for sensor - Not Found", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac/stats`
            .replace(":networkCode", "fakeNet")
            .replace(":gatewayMac", "00:00:00:00:00:00")
            .replace(":sensorMac", "00:00:00:00:00:01");

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
            code: 404,
            name: "NotFoundError",
            message: expect.stringMatching(/not found/i),
        });
    });

    it("get stats for sensor - empty sensor (no measurements)", async () => {
        const url = buildUrl(TEST_SENSORS.sensor1_gateway2_Net1); // sensore senza misurazioni

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(200);

        console.log(response.body);
        expect(response.body).toEqual({
            mean: 0,
            variance: 0,
            upperThreshold: 0,
            lowerThreshold: 0,
          });
    });
});

describe(`GET - ${CONFIG.ROUTES.V1_SENSORS}/:sensorMac/outliers`, () => {
    let tokenAdmin: string;
    let tokenOperator: string;
    let tokenViewer: string;

    const sensor = TEST_SENSORS.sensor2_gateway1_Net2;

    beforeAll(async () => {
        await beforeAllE2e();
        tokenAdmin = generateToken(TEST_USERS.admin);
        tokenOperator = generateToken(TEST_USERS.operator);
        tokenViewer = generateToken(TEST_USERS.viewer);
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    const buildUrl = (sensorOverride = sensor) =>
        `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac/outliers`
            .replace(":networkCode", sensorOverride.networkCode)
            .replace(":gatewayMac", sensorOverride.gatewayMac)
            .replace(":sensorMac", sensorOverride.sensorMac);

    it("get outliers for sensor - Admin", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        const result = response.body;
        console.log("Response body for outliers - no outliers:", result);
        expect(result).toBeDefined();
        expect(result.sensorMacAddress).toBe(TEST_SENSORS.sensor2_gateway1_Net2.sensorMac);

        //NO OUTLIERS
        //just sensorMac, no measurements, stats
        expect(result).not.toHaveProperty("measurements");
        expect(result).not.toHaveProperty("stats");

    });

    it("get outliers for sensor - Operator", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenOperator}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        const result = response.body;
        expect(result).toBeDefined();
        expect(result.sensorMacAddress).toBe(TEST_SENSORS.sensor2_gateway1_Net2.sensorMac);
        //NO OUTLIERS
        //just sensorMac, no measurements, stats
        expect(result).not.toHaveProperty("measurements");
        expect(result).not.toHaveProperty("stats");
        
    });

    it("get outliers for sensor - Viewer", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenViewer}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        const result = response.body;
        expect(result).toBeDefined();
        expect(result.sensorMacAddress).toBe(TEST_SENSORS.sensor2_gateway1_Net2.sensorMac);
        //NO OUTLIERS
        //just sensorMac, no measurements, stats
        expect(result).not.toHaveProperty("measurements");
        expect(result).not.toHaveProperty("stats");
    });

    //TODO: TETS WITH >0 OUTLIERS!! CREATE ANOTHER NETWORK/SENSOR WITH OUTLIERS

    it("get outliers - invalid startDate", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .query({ startDate: "not-a-date" })
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            code: 400,
            name: "Bad Request",
            message: expect.stringContaining("startDate must match format"),
        });
    });

    it("get outliers - invalid endDate", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .query({ endDate: "invalid-end-date" })
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            code: 400,
            name: "Bad Request",
            message: expect.stringContaining("endDate must match format"),
        });
    });

    it("get outliers - Unauthorized (no token)", async () => {
        const url = buildUrl();

        const response = await request(app).get(url);

        expect(response.status).toBe(401);
        expect(response.body).toBeDefined();
    });

    it("get outliers - Unauthorized (invalid token)", async () => {
        const url = buildUrl();

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer invalid.token.here`);

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("get outliers - Not Found", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/nonexistent/outliers`
            .replace(":networkCode", "fakeNet")
            .replace(":gatewayMac", "00:00:00:00:00:00")
            .replace(":sensorMac", "00:00:00:00:00:99");

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/Entity not found/);
    });

    it("get outliers - sensor with no outliers", async () => {
        const url = buildUrl(TEST_SENSORS.sensor1_gateway1_Net1); // sensore senza outlier

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("measurements");
        expect(Array.isArray(response.body.measurements)).toBe(true);
        expect(response.body.measurements).toHaveLength(0);
    });

    it("get measurements for network - empty network", async () => {
        const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/measurements`
            .replace(":networkCode", TEST_NETWORKS.network3.networkCode);
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);
        expect(response.status).toBe(200);
        console.log("Response body for empty network:", response.body);
        expect(response.body).toBeDefined();
        expect(response.body).toEqual([]); // should return an empty array for a network with no measurements
    });

    it("get measurements for network - not empty network", async () => {
        const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/measurements`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode);
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(200);
        console.log("Response body for network with measurements:", response.body);
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(TEST_MEASUREMENTS.length_NET1_gateway1_sensor1 + TEST_MEASUREMENTS.length_NET1_gateway2_sensor1);
    
    });


    it("get measurements for network - specify sensorMacs", async () => {
        const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/measurements`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode);


        //just get the measurements for sensor1_gateway1_Net1
        const response = await request(app)
            .get(url)
            .query({ sensorMacs: TEST_SENSORS.sensor1_gateway1_Net1.sensorMac })
            .set("Authorization", `Bearer ${tokenAdmin}`);
        expect(response.status).toBe(200);
        console.log("Response body for network with measurements and sensorMacs:", response.body);
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        //this should return only the measurements for sensor1_gateway1_Net1
        //so length 1
        expect(response.body).toHaveLength(1);
        //check that the first measurement is the one for sensor1_gateway1_Net1
        expect(response.body[0].sensorMacAddress).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        //check stats and measurements
        expect(response.body[0].stats).toBeDefined();
        const computedMean = (TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.value +
            TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.value +
            TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.value) / 3;

        expect(response.body[0].stats.mean).toBeCloseTo(computedMean, 4);

        const computedVariance =
            ((Math.pow(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.value - computedMean, 2) +
                Math.pow(TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.value - computedMean, 2) +
                Math.pow(TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.value - computedMean, 2)) /
                3);

        expect(response.body[0].stats.variance).toBeCloseTo(computedVariance, 4);

        expect(response.body[0].measurements).toBeDefined();
        expect(Array.isArray(response.body[0].measurements)).toBe(true);
        expect(response.body[0].measurements).toHaveLength(TEST_MEASUREMENTS.length_NET1_gateway1_sensor1);

    });

    it("get measurements for network - empty query param sensorMacs", async () => {
        const url = `${CONFIG.ROUTES.V1_NETWORKS}/:networkCode/measurements`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode);
        const response = await request(app)
            .get(url)
            .query({ sensorMacs: "" }) // empty sensorMacs query param
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(400); //bad request
        expect(response.body).toBeDefined();

    });

    


        

});