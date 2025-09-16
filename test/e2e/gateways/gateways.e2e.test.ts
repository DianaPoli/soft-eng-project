/**
 * Gateways.full.e2e.test.ts
 * Creation date: 2025-05-17
 * Last revision date: 2025-05-17
 * SWE Group 54
 */

import request from "supertest";
import { app } from "@app"; //this is the REAL express server
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS, TEST_NETWORKS, TEST_SENSORS, TEST_GATEWAYS } from "@test/e2e/lifecycle";
import { CONFIG } from "@config";
import { UnauthorizedError } from '../../../src/models/errors/UnauthorizedError';

describe(`GET - ${CONFIG.ROUTES.V1_GATEWAYS}`, () => {
    //generate tokens for the test users
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


    it("get gateways and nested sensors - Admin", async () => {
        //network NET01 has 2 gateways. It is created by the beforeAllE2e function
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}`.replace(":networkCode", TEST_NETWORKS.network1.networkCode);
        
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveLength(TEST_GATEWAYS.length_NET1); //2 gateways

        //GW1 + nested sensors
        expect(response.body[0].macAddress).toBe(TEST_GATEWAYS.gateway1_Net1.gatewayMac);
        expect(response.body[0].name).toBeUndefined();
        expect(response.body[0].description).toBeUndefined();
        expect(response.body[0].sensors).toHaveLength(TEST_SENSORS.length_NET1_gateway1); //2 sensors
        expect(response.body[0].sensors[0].macAddress).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        expect(response.body[0].sensors[0].name).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorName);
        expect(response.body[0].sensors[0].description).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorDescription);
        expect(response.body[0].sensors[0].variable).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorVariable);
        expect(response.body[0].sensors[0].unit).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorUnit);
        expect(response.body[0].sensors[1].macAddress).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorMac);
        expect(response.body[0].sensors[1].name).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorName);
        expect(response.body[0].sensors[1].description).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorDescription);
        expect(response.body[0].sensors[1].variable).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorVariable);
        expect(response.body[0].sensors[1].unit).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorUnit);


        //GW2 + nested sensors
        expect(response.body[1].macAddress).toBe(TEST_GATEWAYS.gateway2_Net1.gatewayMac);
        expect(response.body[1].name).toBe(TEST_GATEWAYS.gateway2_Net1.gatewayName);
        expect(response.body[1].description).toBe(TEST_GATEWAYS.gateway2_Net1.gatewayDescription);
        expect(response.body[1].sensors).toHaveLength(TEST_SENSORS.length_NET1_gateway2); //1 sensor
        expect(response.body[1].sensors[0].macAddress).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorMac);
        expect(response.body[1].sensors[0].name).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorName);
        expect(response.body[1].sensors[0].description).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorDescription);
        expect(response.body[1].sensors[0].variable).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorVariable);
        expect(response.body[1].sensors[0].unit).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorUnit);

    });

    it("get gateways and nested sensors - Operator", async () => {
        //network NET01 has 2 gateways. It is created by the beforeAllE2e function
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}`.replace(":networkCode", TEST_NETWORKS.network1.networkCode);
        
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenOperator}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveLength(TEST_GATEWAYS.length_NET1); //2 gateways

        //GW1 + nested sensors
        expect(response.body[0].macAddress).toBe(TEST_GATEWAYS.gateway1_Net1.gatewayMac);
        expect(response.body[0].name).toBeUndefined();
        expect(response.body[0].description).toBeUndefined();
        expect(response.body[0].sensors).toHaveLength(TEST_SENSORS.length_NET1_gateway1); //2 sensors
        expect(response.body[0].sensors[0].macAddress).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        expect(response.body[0].sensors[0].name).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorName);
        expect(response.body[0].sensors[0].description).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorDescription);
        expect(response.body[0].sensors[0].variable).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorVariable);
        expect(response.body[0].sensors[0].unit).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorUnit);
        expect(response.body[0].sensors[1].macAddress).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorMac);
        expect(response.body[0].sensors[1].name).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorName);
        expect(response.body[0].sensors[1].description).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorDescription);
        expect(response.body[0].sensors[1].variable).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorVariable);
        expect(response.body[0].sensors[1].unit).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorUnit);


        //GW2 + nested sensors
        expect(response.body[1].macAddress).toBe(TEST_GATEWAYS.gateway2_Net1.gatewayMac);
        expect(response.body[1].name).toBe(TEST_GATEWAYS.gateway2_Net1.gatewayName);
        expect(response.body[1].description).toBe(TEST_GATEWAYS.gateway2_Net1.gatewayDescription);
        expect(response.body[1].sensors).toHaveLength(TEST_SENSORS.length_NET1_gateway2); //1 sensor
        expect(response.body[1].sensors[0].macAddress).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorMac);
        expect(response.body[1].sensors[0].name).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorName);
        expect(response.body[1].sensors[0].description).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorDescription);
        expect(response.body[1].sensors[0].variable).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorVariable);
        expect(response.body[1].sensors[0].unit).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorUnit);

    });


    it("get gateways and nested sensors - Viewer", async () => {
        //network NET01 has 2 gateways. It is created by the beforeAllE2e function
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}`.replace(":networkCode", TEST_NETWORKS.network1.networkCode);
        
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenViewer}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveLength(TEST_GATEWAYS.length_NET1); //2 gateways

       //GW1 + nested sensors
        expect(response.body[0].macAddress).toBe(TEST_GATEWAYS.gateway1_Net1.gatewayMac);
        expect(response.body[0].name).toBeUndefined();
        expect(response.body[0].description).toBeUndefined();
        expect(response.body[0].sensors).toHaveLength(TEST_SENSORS.length_NET1_gateway1); //2 sensors
        expect(response.body[0].sensors[0].macAddress).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        expect(response.body[0].sensors[0].name).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorName);
        expect(response.body[0].sensors[0].description).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorDescription);
        expect(response.body[0].sensors[0].variable).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorVariable);
        expect(response.body[0].sensors[0].unit).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorUnit);
        expect(response.body[0].sensors[1].macAddress).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorMac);
        expect(response.body[0].sensors[1].name).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorName);
        expect(response.body[0].sensors[1].description).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorDescription);
        expect(response.body[0].sensors[1].variable).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorVariable);
        expect(response.body[0].sensors[1].unit).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorUnit);


        //GW2 + nested sensors
        expect(response.body[1].macAddress).toBe(TEST_GATEWAYS.gateway2_Net1.gatewayMac);
        expect(response.body[1].name).toBe(TEST_GATEWAYS.gateway2_Net1.gatewayName);
        expect(response.body[1].description).toBe(TEST_GATEWAYS.gateway2_Net1.gatewayDescription);
        expect(response.body[1].sensors).toHaveLength(TEST_SENSORS.length_NET1_gateway2); //1 sensor
        expect(response.body[1].sensors[0].macAddress).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorMac);
        expect(response.body[1].sensors[0].name).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorName);
        expect(response.body[1].sensors[0].description).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorDescription);
        expect(response.body[1].sensors[0].variable).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorVariable);
        expect(response.body[1].sensors[0].unit).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorUnit);

    });

    it("get gateways and nested sensors - Unauthorized", async () => {
        //network NET01 has 2 gateways. It is created by the beforeAllE2e function
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}`.replace(":networkCode", TEST_NETWORKS.network1.networkCode);
        
        const response = await request(app)
            .get(url);
            //no token provided (ex. external internet user)
            //in this case it's rater the open API validator that will throw the error

        expect(response.status).toBe(401);
        expect(response.body).toBeDefined();


        //now try with an invalid token
        const response2 = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}invalid_or_expired`);

        expect(response2.status).toBe(401);
        expect(response2.body).toBeDefined();
        expect(response2.body.message).toMatch(/Unauthorized/);
    });


    it("get gateways and nested sensors - 404 Not Found", async () => {
        //use a non-existing network code
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}`.replace(":networkCode", "non_existing_network_code");

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Entity not found/);
    });

    it("get gateways and nested sensors - empty network", async () => {
       //NET03 is empty
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}`.replace(":networkCode", TEST_NETWORKS.network3.networkCode);

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveLength(0); //0 gateways
    });


});


describe(`GET - ${CONFIG.ROUTES.V1_GATEWAYS}/:gatewayMac`, () => {

    //generate tokens for the test users
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


    it("get a gateway and its nested sensors (0 nested sensors) - Admin", async () => {
        //get gateway2 from NET02
        //it has no nested sensors
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}/:gatewayMac`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway2_Net2.gatewayMac);
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);
        
        expect(response.status).toBe(200);
        console.log(response.body);
        expect(response.body).toBeDefined();
        expect(response.body.macAddress).toBe(TEST_GATEWAYS.gateway2_Net2.gatewayMac);
        expect(response.body.name).toBe(TEST_GATEWAYS.gateway2_Net2.gatewayName);
        expect(response.body.description).toBe(TEST_GATEWAYS.gateway2_Net2.gatewayDescription);
        //since it has no nested sensors, sensors is undefined
        expect(response.body.sensors).toBeUndefined();
    
    });

    it("get a gateway and its nested sensors - Operator", async () => {
        //get gateway1 from NET02
        //it has 3 nested sensors
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}/:gatewayMac`.replace(":networkCode", TEST_NETWORKS.network2.networkCode).replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net2.gatewayMac);
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenOperator}`);
        
        expect(response.status).toBe(200);
        console.log(response.body);
        expect(response.body).toBeDefined();
        expect(response.body.macAddress).toBe(TEST_GATEWAYS.gateway1_Net2.gatewayMac);
        expect(response.body.name).toBe(TEST_GATEWAYS.gateway1_Net2.gatewayName);
        expect(response.body.description).toBe(TEST_GATEWAYS.gateway1_Net2.gatewayDescription);
        expect(response.body.sensors).toBeDefined();
        expect(response.body.sensors).toHaveLength(TEST_SENSORS.length_NET2_gateway1); //3 sensors
        //sort by sensorMac
        response.body.sensors.sort((a: any, b: any) => a.macAddress.localeCompare(b.macAddress));

        //check the sensors
        expect(response.body.sensors[0]).toBeDefined();
        expect(response.body.sensors[1]).toBeDefined();
        expect(response.body.sensors[2]).toBeDefined();
        expect(response.body.sensors[0].macAddress).toBe(TEST_SENSORS.sensor1_gateway1_Net2.sensorMac);
        expect(response.body.sensors[1].macAddress).toBe(TEST_SENSORS.sensor2_gateway1_Net2.sensorMac);
        expect(response.body.sensors[2].macAddress).toBe(TEST_SENSORS.sensor3_gateway1_Net2.sensorMac);
    });

    it("get a gateway and its nested sensors - Viewer", async () => {
        //get gateway1 from NET02
        //it has 3 nested sensors
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}/:gatewayMac`.replace(":networkCode", TEST_NETWORKS.network2.networkCode).replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net2.gatewayMac);
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenViewer}`);
        
        expect(response.status).toBe(200);
        console.log(response.body);
        expect(response.body).toBeDefined();
        expect(response.body.macAddress).toBe(TEST_GATEWAYS.gateway1_Net2.gatewayMac);
        expect(response.body.name).toBe(TEST_GATEWAYS.gateway1_Net2.gatewayName);
        expect(response.body.description).toBe(TEST_GATEWAYS.gateway1_Net2.gatewayDescription);
        expect(response.body.sensors).toBeDefined();
        expect(response.body.sensors).toHaveLength(TEST_SENSORS.length_NET2_gateway1); //3 sensors
        //sort by sensorMac
        response.body.sensors.sort((a: any, b: any) => a.macAddress.localeCompare(b.macAddress));

        //check the sensors
        expect(response.body.sensors[0]).toBeDefined();
        expect(response.body.sensors[1]).toBeDefined();
        expect(response.body.sensors[2]).toBeDefined();
        expect(response.body.sensors[0].macAddress).toBe(TEST_SENSORS.sensor1_gateway1_Net2.sensorMac);
        expect(response.body.sensors[1].macAddress).toBe(TEST_SENSORS.sensor2_gateway1_Net2.sensorMac);
        expect(response.body.sensors[2].macAddress).toBe(TEST_SENSORS.sensor3_gateway1_Net2.sensorMac);
    });

    it("get a gateway and its nested sensors - Unauthorized", async () => {
        //get gateway1 from NET02
        //it has 3 nested sensors
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}/:gatewayMac`.replace(":networkCode", TEST_NETWORKS.network2.networkCode).replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net2.gatewayMac);
        const response = await request(app)
            .get(url);
            //no token provided (ex. external internet user)
            //in this case it's rater the open API validator that will throw the error

        expect(response.status).toBe(401);
        expect(response.body).toBeDefined();

        //now try with an invalid token
        const response2 = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}invalid_or_expired`);

        expect(response2.status).toBe(401);
        expect(response2.body).toBeDefined();
        expect(response2.body.message).toMatch(/Unauthorized/);
    });

    it("get a gateway and its nested sensors - 404 Not Found", async () => {
        //use a non-existing network code
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}/:gatewayMac`.replace(":networkCode", "non_existing_network_code").replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net2.gatewayMac);

        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Entity not found/);


        //now use an existing network code but a non-existing gatewayMac
        const url2 = `${CONFIG.ROUTES.V1_GATEWAYS}/:gatewayMac`.replace(":networkCode", TEST_NETWORKS.network2.networkCode).replace(":gatewayMac", "non_existing_gateway_mac");
        const response2 = await request(app)
            .get(url2)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response2.status).toBe(404);
        expect(response2.body).toBeDefined();
        expect(response2.body.message).toMatch(/Entity not found/);


        //now use both a non-existing network code and a non-existing gatewayMac
        const url3 = `${CONFIG.ROUTES.V1_GATEWAYS}/:gatewayMac`.replace(":networkCode", "non_existing_network_code").replace(":gatewayMac", "non_existing_gateway_mac");

        const response3 = await request(app)
            .get(url3)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response3.status).toBe(404);
        expect(response3.body).toBeDefined();
        expect(response3.body.message).toMatch(/Entity not found/);
    });

});


describe(`POST - ${CONFIG.ROUTES.V1_GATEWAYS}`, () => {
    //generate tokens for the test users
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


    it("create a new gateway - Admin", async () => {

        //create a new gateway in NET03
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}`.replace(":networkCode", TEST_NETWORKS.network3.networkCode);
        const newGateway = {
            macAddress: "AA:BB:CC:EE:FF:30",
            name: "Gateway1_NET03",
            description: "NB-IoT gateway1",
        };

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newGateway);

        expect(response.status).toBe(201);
        //no body in the response
        expect(response.body).toEqual({});

        //now check if the gateway is in the DB
        const url2 = `${CONFIG.ROUTES.V1_GATEWAYS}/:gatewayMac`.replace(":networkCode", TEST_NETWORKS.network3.networkCode).replace(":gatewayMac", newGateway.macAddress);
        const response2 = await request(app)
            .get(url2)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response2.status).toBe(200);
        expect(response2.body).toBeDefined();
        expect(response2.body.macAddress).toBe(newGateway.macAddress);
        expect(response2.body.name).toBe(newGateway.name);
        expect(response2.body.description).toBe(newGateway.description);
        expect(response2.body.sensors).toBeUndefined(); //no sensors yet

    });

    it("create a new gateway - Operator", async () => {

        //create a new gateway in NET03
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}`.replace(":networkCode", TEST_NETWORKS.network3.networkCode);
        //put a nested sensor
        //this will be IGNORED by the controller
        const newGateway = {
            macAddress: "AA:BB:CC:EE:FF:31",
            name: "Gateway2_NET03",
            description: "NB-IoT gateway2",
            sensors: [
                {
                    macAddress: "AA:BB:CC:EE:FF:32",
                    name: "Sensor1",
                    description: "NB-IoT sensor1",
                    variable: "temperature",
                    unit: "C",
                },
            ],
        };

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenOperator}`)
            .send(newGateway);

        expect(response.status).toBe(201);
        //no body in the response
        expect(response.body).toEqual({});

        //now check if the gateway is in the DB
        const url2 = `${CONFIG.ROUTES.V1_GATEWAYS}/:gatewayMac`.replace(":networkCode", TEST_NETWORKS.network3.networkCode).replace(":gatewayMac", newGateway.macAddress);
        const response2 = await request(app)
            .get(url2)
            .set("Authorization", `Bearer ${tokenOperator}`);

        expect(response2.status).toBe(200);
        console.log(response2.body);
        expect(response2.body).toBeDefined();
        expect(response2.body.macAddress).toBe(newGateway.macAddress);
        expect(response2.body.name).toBe(newGateway.name);
        expect(response2.body.description).toBe(newGateway.description);
        expect(response2.body.sensors).toBeUndefined(); //the nested sensor IS IGNORED by the controller

    });

    it("create a new gateway - same mac address of an already existing sensor", async () => {
        //create a new gateway in NET03
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}`.replace(":networkCode", TEST_NETWORKS.network3.networkCode);
        //use AA:BB:CC:DD:CC:01 which is the mac address of sensor1_gateway1_Net1
        const newGateway = {
            macAddress: TEST_SENSORS.sensor1_gateway1_Net1.sensorMac, //AA:BB:CC:DD:CC:01
            name: "Gateway3_NET03",
            description: "NB-IoT gateway3",
        };
        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newGateway);
        expect(response.status).toBe(409);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Entity with code .* already exists/);
    });


    it("create a new gateway - test nullable fields", async () => {
        //create a new gateway in NET03
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}`.replace(":networkCode", TEST_NETWORKS.network3.networkCode);
        const newGateway = {
            macAddress: "AA:BB:CC:EE:FF:32"
        };

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newGateway);

        expect(response.status).toBe(201);
        //no body in the response
        expect(response.body).toEqual({});


        //now check if the gateway is in the DB
        const url2 = `${CONFIG.ROUTES.V1_GATEWAYS}/:gatewayMac`.replace(":networkCode", TEST_NETWORKS.network3.networkCode).replace(":gatewayMac", newGateway.macAddress);

        const response2 = await request(app)
            .get(url2)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response2.status).toBe(200);
        expect(response2.body).toBeDefined();
        expect(response2.body.macAddress).toBe(newGateway.macAddress);
        expect(response2.body.name).toBeUndefined(); //name is optional
        expect(response2.body.description).toBeUndefined(); //description is optional


    });


    it("create a new gateway - Viewer", async () => {

        //create a new gateway in NET03
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}`.replace(":networkCode", TEST_NETWORKS.network3.networkCode);
        const newGateway = {
            macAddress: "AA:BB:CC:EE:FF:32",
            name: "Gateway3_NET03",
            description: "NB-IoT gateway3",
        };

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenViewer}`)
            .send(newGateway);

        expect(response.status).toBe(403);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Forbidden/);

    });


    it("create a new gateway - 400 Bad Request", async () => {

        //create a new gateway in NET03
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}`.replace(":networkCode", TEST_NETWORKS.network3.networkCode);


        //simulate missing required fields
        //only macAddress is required
        //name and description are optional
        const newGateway = {
            //macAddress: "AA:BB:CC:EE:FF:30", //missing macAddress
            name: "Gateway1_NET03",
            description: "NB-IoT gateway1",
        };

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newGateway);

        expect(response.status).toBe(400);
        expect(response.body).toBeDefined();

        //simulate invalid types
        const newGateway2 = {
            macAddress: 123, //invalid type
            name: "Gateway1_NET03", 
            description: "NB-IoT gateway1"
        };


        const response2 = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newGateway2);

        expect(response2.status).toBe(400);
        expect(response2.body).toBeDefined();


        const newGateway3 = {
            macAddress: "AA:BB:CC:EE:FF:33",
            name: 123, //invalid type
            description: "NB-IoT gateway1"
        };

        const response3 = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newGateway3);
        
        expect(response3.status).toBe(400);
        expect(response3.body).toBeDefined();

        const newGateway4 = {}; //empty request body

        const response4 = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newGateway4);
        
        expect(response4.status).toBe(400);
        expect(response4.body).toBeDefined();


        const newGateway5 = {
            macAddress: "AA:BB:CC:EE:FF:34",
            name: "Gateway1_NET03", 
            description: ["NB-IoT gateway1"], //invalid type
            sensors: [
                {
                    macAddress: "AA:BB:CC:EE:FF:35",
                    name: "Sensor1",
                    description: "NB-IoT sensor1",
                    variable: "temperature",
                    unit: "C",
                },
            ],
        };

        const response5 = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newGateway5);

        expect(response5.status).toBe(400);
        expect(response5.body).toBeDefined();


        const newGateway6 = {
            macAddress: "AA:BB:CC:EE:FF:34",
            name: "Gateway1_NET03", 
            description: "NB-IoT gateway1",
            sensors: [
                {
                    macAddress: 123, //invalid type
                    name: "Sensor1",
                    description: "NB-IoT sensor1",
                    variable: "temperature",
                    unit: "C",
                },
            ],
        };

        const response6 = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newGateway6);

        expect(response6.status).toBe(400);
        expect(response6.body).toBeDefined();


    });


    it("create a new gateway - 401 Unauthorized", async () => {
        //create a new gateway in NET03
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}`.replace(":networkCode", TEST_NETWORKS.network3.networkCode);
        const newGateway = {
            macAddress: "AA:BB:CC:EE:FF:30",
            name: "Gateway1_NET03",
            description: "NB-IoT gateway1",
        };

        const response = await request(app)
            .post(url)
            .send(newGateway); //no token provided (ex. external internet user)
            //in this case it's rater the open API validator that will throw the error

        expect(response.status).toBe(401);
        expect(response.body).toBeDefined();

        //now try with an invalid token
        const response2 = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}invalid_or_expired`)
            .send(newGateway);

        expect(response2.status).toBe(401);
        expect(response2.body).toBeDefined();
        expect(response2.body.message).toMatch(/Unauthorized/);
    });


    it("create a new gateway - 403 Insufficient rights", async () => {
        //create a new gateway in NET03
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}`.replace(":networkCode", TEST_NETWORKS.network3.networkCode);
        const newGateway = {
            macAddress: "AA:BB:CC:EE:FF:30",
            name: "Gateway1_NET03",
            description: "NB-IoT gateway1",
        };

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenViewer}`)
            .send(newGateway);

        expect(response.status).toBe(403);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Forbidden/);
    });


    it("create a new gateway - 404 Not Found", async () => {
        //create a new gateway in NET03
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}`.replace(":networkCode", "non_existing_network_code");
        const newGateway = {
            macAddress: "AA:BB:CC:EE:FF:30",
            name: "Gateway1_NET03",
            description: "NB-IoT gateway1",
        };

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newGateway);

        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Entity not found/);
    });

    it("create a new gateway - 409 Conflict", async () => {
        //create a new gateway in NET03
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}`.replace(":networkCode", TEST_NETWORKS.network1.networkCode);
        const newGateway = {
            macAddress: TEST_GATEWAYS.gateway1_Net1.gatewayMac, //this gateway already exists in NET01
            name: "Gateway1_NET01_conflict",
            description: "LoRaWAN_conflict",
        };

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newGateway);

        expect(response.status).toBe(409);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Entity with code .* already exists/);
    });


    it("update a gateway - 409 Conflict - mac address used by a sensor", async () => {
        //update an existing gateway in NET01
        //but use a mac address that is already used by a sensor
        const url = `${CONFIG.ROUTES.V1_GATEWAYS}/:gatewayMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac);
        const updatedGateway = {
            macAddress: TEST_SENSORS.sensor1_gateway1_Net1.sensorMac //AA:BB:CC:DD:CC:01, already used by a sensor
        };
        
        const response = await request(app)
            .patch(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(updatedGateway);
        expect(response.status).toBe(409);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Entity with code .* already exists/);
    });



});