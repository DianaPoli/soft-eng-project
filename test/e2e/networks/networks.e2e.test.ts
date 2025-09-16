/**
 * Networks.full.e2e.test.ts
 * Creation date: 2025-05-15
 * Last revision date: 2025-05-16
 * SWE Group 54
 */

import request from "supertest";
import { app } from "@app"; //this is the REAL express server
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS, TEST_NETWORKS, TEST_GATEWAYS, TEST_SENSORS } from "@test/e2e/lifecycle";
import { CONFIG } from "@config";


describe(`POST - ${CONFIG.ROUTES.V1_NETWORKS} (e2e)`, () => {
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

    it("create a network (Admin)", async () => {
        //url is /api/v1/networks
        //request params are empty
        //request body is {code: "testNetworkCode", name: "Test Network", description: "Test Description"}
        //since admin can create a network, the request should be successful

        const testReqBody = {
            code: "testNetworkCodefulle2e",
            name: "Test Network_fulle2e",
            description: "Test Description_fulle2e"
        };

        const res = await request(app)
            .post(CONFIG.ROUTES.V1_NETWORKS)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(testReqBody);


        //res should return status 201 and no body
        expect(res.status).toBe(201);
        expect(res.body).toEqual({});

    });

    it("create a network (Operator)", async () => {
        //url is /api/v1/networks
        //request params are empty
        //request body is {code: "testNetworkCode", name: "Test Network", description: "Test Description"}
        //since operator can create a network, the request should be successful

        const testReqBody = {
            code: "testNetworkCode2fulle2e",
            name: "Test Network2_fulle2e",
            description: "Test Description2_fulle2e"
        };

        const res = await request(app)
            .post(CONFIG.ROUTES.V1_NETWORKS)
            .set("Authorization", `Bearer ${tokenOperator}`)
            .send(testReqBody);

        console.log("res.body", res.body);
        //res should return status 201 and no body
        expect(res.status).toBe(201);
        expect(res.body).toEqual({});

    });

    

    it("create a network (Viewer)", async () => {
        //url is /api/v1/networks
        //request params are empty
        //request body is {code: "testNetworkCode", name: "Test Network", description: "Test Description"}
        //since viewer CANNOT create a network, the request should fail with 403

        const testReqBody = {
            code: "testNetworkCode3fulle2e",
            name: "Test Network3_fulle2e",
            description: "Test Description3_fulle2e"
        };

        const res = await request(app)
            .post(CONFIG.ROUTES.V1_NETWORKS)
            .set("Authorization", `Bearer ${tokenViewer}`)
            .send(testReqBody);

        //res should return status 403
        expect(res.status).toBe(403);
        expect(res.body).toBeDefined();
        expect(res.body.message).toMatch(/Forbidden: Insufficient rights/);
        expect(res.body.name).toBe("InsufficientRightsError");
        expect(res.body.code).toBe(403);

    });

    it("create a network - 400 Bad Request (Admin)", async () => {

        const testReqBody = {
            code: 11, //invalid type
            name: "TestNetworkfulle2etest400",
            description: "Test Description_fulle2e"
        };

        const res = await request(app)
            .post(CONFIG.ROUTES.V1_NETWORKS)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(testReqBody);

        //res should return status 400
        expect(res.status).toBe(400);


        const testReqBody2 = {
            code: "testNetworkCode fulle2e test400",
            name: "Test Network_fulle2e",
            description: [1, 2, 3] //invalid type
        };

        const res2 = await request(app)
            .post(CONFIG.ROUTES.V1_NETWORKS)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(testReqBody2);

        //res should return status 400
        expect(res2.status).toBe(400);


    });

    it("create a network - 401 Unauthorized (Admin)", async () => {
        const testReqBody = {
            code: "testNetworkCodefulle2etest401",
            name: "Test Network_fulle2e",
            description: "Test Description_fulle2e"
        };

        const res = await request(app)
            .post(CONFIG.ROUTES.V1_NETWORKS)
            .set("Authorization", `Bearer ${tokenAdmin}invalid_or_expired`)
            .send(testReqBody);

        //res should return status 401
        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Unauthorized/);

    });

    it("create a network - 409 Conflict (Admin)", async () => {
        const testReqBody = {
            code: "NET01", //this code already exists in the DB
            name: "Test Network fulle2e",
            description: "Test Description_fulle2e"
        };

        const res = await request(app)
            .post(CONFIG.ROUTES.V1_NETWORKS)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(testReqBody);

        //res should return status 409
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/Entity with code .* already exists/);

    });

});


describe(`GET - ${CONFIG.ROUTES.V1_NETWORKS} (e2e)`, () => {
    //generate tokens for the test users
    let tokenAdmin: string;
    let tokenOperator: string;
    let tokenViewer: string;

    beforeAll(async () => {
        await beforeAllE2e();
        tokenAdmin = generateToken(TEST_USERS.admin);
        tokenOperator = generateToken(TEST_USERS.operator);
        tokenViewer = generateToken(TEST_USERS.viewer);

        //create a network for the tests
        const testReqBody = {
            code: "testNetworkCode2fulle2e",
            name: "Test Network2_fulle2e",
            description: "Test Description2_fulle2e"
        };
        const res = await request(app)
            .post(CONFIG.ROUTES.V1_NETWORKS)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(testReqBody);
        //res should return status 201 and no body
        expect(res.status).toBe(201);
        expect(res.body).toEqual({});
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("get network (Admin)", async () => {

        const testReqBody = {
            code: "testNetworkCode2fulle2e",
            name: "Test Network2_fulle2e",
            description: "Test Description2_fulle2e"
        };

        //now try to get the network
        const resGet = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/${testReqBody.code}`)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        //res should return status 200 and the network
        expect(resGet.status).toBe(200);
        //res body should be a JSON constructed from the NetworkDTO
        //check on all fields + overall structure (i.e. no other fields, just the ones in the DTO)
        expect(resGet.body).toBeDefined();
        expect(resGet.body).toEqual(testReqBody);
        //manual check on all fields 
        expect(resGet.body.code).toBeDefined();
        expect(resGet.body.code).toBe(testReqBody.code);
        expect(resGet.body.name).toBeDefined();
        expect(resGet.body.name).toBe(testReqBody.name);
        expect(resGet.body.description).toBeDefined();
        expect(resGet.body.description).toBe(testReqBody.description);
    });

    it("get network (Operator)", async () => {

        const testReqBody = {
            code: "testNetworkCode2fulle2e",
            name: "Test Network2_fulle2e",
            description: "Test Description2_fulle2e"
        };

        //now try to get the network
        const resGet = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/${testReqBody.code}`)
            .set("Authorization", `Bearer ${tokenOperator}`);

        //res should return status 200 and the network
        expect(resGet.status).toBe(200);
        //res body should be a JSON constructed from the NetworkDTO
        //check on all fields + overall structure (i.e. no other fields, just the ones in the DTO)
        expect(resGet.body).toBeDefined();
        expect(resGet.body).toEqual(testReqBody);
        //manual check on all fields 
        expect(resGet.body.code).toBeDefined();
        expect(resGet.body.code).toBe(testReqBody.code);
        expect(resGet.body.name).toBeDefined();
        expect(resGet.body.name).toBe(testReqBody.name);
        expect(resGet.body.description).toBeDefined();
        expect(resGet.body.description).toBe(testReqBody.description);
    });

    it("get network (Viewer)", async () => {

        const testReqBody = {
            code: "testNetworkCode2fulle2e",
            name: "Test Network2_fulle2e",
            description: "Test Description2_fulle2e"
        };

        //now try to get the network
        const resGet = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/${testReqBody.code}`)
            .set("Authorization", `Bearer ${tokenViewer}`);

        //res should return status 200 and the network
        expect(resGet.status).toBe(200);
        //res body should be a JSON constructed from the NetworkDTO
        //check on all fields + overall structure (i.e. no other fields, just the ones in the DTO)
        expect(resGet.body).toBeDefined();
        expect(resGet.body).toEqual(testReqBody);
        //manual check on all fields 
        expect(resGet.body.code).toBeDefined();
        expect(resGet.body.code).toBe(testReqBody.code);
        expect(resGet.body.name).toBeDefined();
        expect(resGet.body.name).toBe(testReqBody.name);
        expect(resGet.body.description).toBeDefined();
        expect(resGet.body.description).toBe(testReqBody.description);
    });

    it("get network - nested gateways (Admin)", async () => {
        //NET01 has 2 nested gateways (it's the one created in the beforeAll)
        const resGet = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/NET01`)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        //res should return status 200 and the network
        expect(resGet.status).toBe(200);

        console.log("resGet.body", resGet.body);

        expect(resGet.body).toBeDefined();
        expect(resGet.body.code).toBe(TEST_NETWORKS.network1.networkCode);
        expect(resGet.body.name).toBe(TEST_NETWORKS.network1.networkName);
        expect(resGet.body.description).toBe(TEST_NETWORKS.network1.networkDescription);
        //check the nested gateways
        expect(resGet.body.gateways).toBeDefined();
        expect(resGet.body.gateways.length).toBe(TEST_GATEWAYS.length_NET1); //2 gateways
        //sort by gatewayMac
        resGet.body.gateways.sort((a: any, b: any) => {
            return a.macAddress.localeCompare(b.macAddress);
        });

        expect(resGet.body.gateways[0]).toBeDefined();
        expect(resGet.body.gateways[0].macAddress).toBe(TEST_GATEWAYS.gateway1_Net1.gatewayMac);
        expect(resGet.body.gateways[0].name).toBeUndefined();
        expect(resGet.body.gateways[0].description).toBeUndefined();
        expect(resGet.body.gateways[1]).toBeDefined();
        expect(resGet.body.gateways[1].macAddress).toBe(TEST_GATEWAYS.gateway2_Net1.gatewayMac);
        expect(resGet.body.gateways[1].name).toBe(TEST_GATEWAYS.gateway2_Net1.gatewayName);
        expect(resGet.body.gateways[1].description).toBe(TEST_GATEWAYS.gateway2_Net1.gatewayDescription);

        //test nested sensors in each gateway
        expect(resGet.body.gateways[0].sensors).toBeDefined();
        expect(resGet.body.gateways[0].sensors.length).toBe(TEST_SENSORS.length_NET1_gateway1); //2 sensors
        expect(resGet.body.gateways[1].sensors).toBeDefined();
        expect(resGet.body.gateways[1].sensors.length).toBe(TEST_SENSORS.length_NET1_gateway2); //1 sensor
        //sort by sensorMac in gw1
        resGet.body.gateways[0].sensors.sort((a: any, b: any) => {
            return a.macAddress.localeCompare(b.macAddress);
        });
        //check the sensors in gw1
        expect(resGet.body.gateways[0].sensors[0]).toBeDefined();
        expect(resGet.body.gateways[0].sensors[0].name).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorName);
        expect(resGet.body.gateways[0].sensors[0].description).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorDescription);
        expect(resGet.body.gateways[0].sensors[0].variable).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorVariable);
        expect(resGet.body.gateways[0].sensors[0].unit).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorUnit);
        expect(resGet.body.gateways[0].sensors[1]).toBeDefined();
        expect(resGet.body.gateways[0].sensors[1].macAddress).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorMac);
        expect(resGet.body.gateways[0].sensors[1].name).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorName);
        expect(resGet.body.gateways[0].sensors[1].description).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorDescription);
        expect(resGet.body.gateways[0].sensors[1].variable).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorVariable);
        expect(resGet.body.gateways[0].sensors[1].unit).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorUnit);
        //check the sensors in gw2
        expect(resGet.body.gateways[1].sensors[0]).toBeDefined();
        expect(resGet.body.gateways[1].sensors[0].macAddress).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorMac);
        expect(resGet.body.gateways[1].sensors[0].name).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorName);
        expect(resGet.body.gateways[1].sensors[0].description).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorDescription);
        expect(resGet.body.gateways[1].sensors[0].variable).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorVariable);
        expect(resGet.body.gateways[1].sensors[0].unit).toBe(TEST_SENSORS.sensor1_gateway2_Net1.sensorUnit);


    });

    it("get network - test nullable fields (Admin)", async () => {
        //NET03 has just the networkCode, all the other fields are null in db
        //so they should not be propagated at all in the response

        const resGet = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/NET03`)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        //res should return status 200 and the network
        expect(resGet.status).toBe(200);
        expect(resGet.body).toBeDefined();
        expect(resGet.body.code).toBe(TEST_NETWORKS.network3.networkCode);
        expect(resGet.body).not.toHaveProperty("name");
        expect(resGet.body).not.toHaveProperty("description");


    });
    
    it("get network - 401 Unauthorized (Admin)", async () => {
        const testReqBody = {
            code: "testNetworkCode2fulle2e",
            name: "Test Network2_fulle2e",
            description: "Test Description2_fulle2e"
        };

        //now try to get the network
        const resGet = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/${testReqBody.code}`)
            .set("Authorization", `Bearer ${tokenAdmin}invalid_or_expired`);

        //res should return status 401
        expect(resGet.status).toBe(401);
        expect(resGet.body.message).toMatch(/Unauthorized/);
    });


    it("get network - 404 Not Found (Admin)", async () => {

        const testReqBody = {
            code: "testNetworkCode2fulle2enotFound",
            name: "Test Network2_fulle2e",
            description: "Test Description2_fulle2e"
        };

        //now try to get the network
        const resGet = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/${testReqBody.code}`)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        //res should return status 404
        expect(resGet.status).toBe(404);
        expect(resGet.body.message).toMatch(/Entity not found/);
    });

});


describe(`GET  (e2e)`, () => {

    //generate tokens for the test users
    let tokenAdmin: string;
    let tokenOperator: string;
    let tokenViewer: string;

    beforeAll(async () => {
        await beforeAllE2e();
        tokenAdmin = generateToken(TEST_USERS.admin);
        tokenOperator = generateToken(TEST_USERS.operator);
        tokenViewer = generateToken(TEST_USERS.viewer);

        //create a network for the tests
        const testReqBody = {
            code: "testNetworkCode2fulle2e",
            name: "Test Network2_fulle2e",
            description: "Test Description2_fulle2e"
        };
        const res = await request(app)
            .post(CONFIG.ROUTES.V1_NETWORKS)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(testReqBody);
        //res should return status 201 and no body
        expect(res.status).toBe(201);
        expect(res.body).toEqual({});

        //create another network for the tests
        const testReqBody2 = {
            code: "testNetworkCode3fulle2e",
            name: "Test Network3_fulle2e",
            description: "Test Description3_fulle2e"
        };
        const res2 = await request(app)
            .post(CONFIG.ROUTES.V1_NETWORKS)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(testReqBody2);
        //res should return status 201 and no body
        expect(res2.status).toBe(201);
        expect(res2.body).toEqual({});
    });

    afterAll(async () => {
        await afterAllE2e();
    });


    it("get all networks (Admin)", async () => {
        //url is /api/v1/networks
        //request params are empty
        //request body is empty
        //since admin can get all networks, the request should be successful

        const resGet = await request(app)
            .get(CONFIG.ROUTES.V1_NETWORKS)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        //res should return status 200 and the networks
        expect(resGet.status).toBe(200);
        //res body should be a JSON constructed from the NetworkDTO
        //check on all fields + overall structure (i.e. no other fields, just the ones in the DTO)
        expect(resGet.body).toBeDefined();
        expect(resGet.body.length).toBe(TEST_NETWORKS.length + 2); //THIS WILL NEED TO BE CHANGED WHEN DOING BASE E2E TEST WITH PRELOADED ENTITIIES IN THE CONFIG
        expect(resGet.body[TEST_NETWORKS.length].code).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length].code).toBe("testNetworkCode2fulle2e");
        expect(resGet.body[TEST_NETWORKS.length].name).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length].name).toBe("Test Network2_fulle2e");
        expect(resGet.body[TEST_NETWORKS.length].description).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length].description).toBe("Test Description2_fulle2e");
        expect(resGet.body[TEST_NETWORKS.length + 1].code).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length + 1].code).toBe("testNetworkCode3fulle2e");
        expect(resGet.body[TEST_NETWORKS.length + 1].name).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length + 1].name).toBe("Test Network3_fulle2e");
        expect(resGet.body[TEST_NETWORKS.length + 1].description).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length + 1].description).toBe("Test Description3_fulle2e");

    });

    it("get all networks (Operator)", async () => {
        //url is /api/v1/networks
        //request params are empty
        //request body is empty
        //since operator can get all networks, the request should be successful

        const resGet = await request(app)
            .get(CONFIG.ROUTES.V1_NETWORKS)
            .set("Authorization", `Bearer ${tokenOperator}`);

        //res should return status 200 and the networks
        expect(resGet.status).toBe(200);
        //res body should be a JSON constructed from the NetworkDTO
        //check on all fields + overall structure (i.e. no other fields, just the ones in the DTO)
        expect(resGet.body).toBeDefined();
        expect(resGet.body.length).toBe(TEST_NETWORKS.length + 2);
        expect(resGet.body[TEST_NETWORKS.length].code).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length].code).toBe("testNetworkCode2fulle2e");
        expect(resGet.body[TEST_NETWORKS.length].name).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length].name).toBe("Test Network2_fulle2e");
        expect(resGet.body[TEST_NETWORKS.length].description).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length].description).toBe("Test Description2_fulle2e");
        expect(resGet.body[TEST_NETWORKS.length + 1].code).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length + 1].code).toBe("testNetworkCode3fulle2e");
        expect(resGet.body[TEST_NETWORKS.length + 1].name).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length + 1].name).toBe("Test Network3_fulle2e");
        expect(resGet.body[TEST_NETWORKS.length + 1].description).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length + 1].description).toBe("Test Description3_fulle2e");

    });


    it("get all networks (Viewer)", async () => {
        //url is /api/v1/networks
        //request params are empty
        //request body is empty
        //since viewer can get all networks, the request should be successful

        const resGet = await request(app)
            .get(CONFIG.ROUTES.V1_NETWORKS)
            .set("Authorization", `Bearer ${tokenViewer}`);

        //res should return status 200 and the networks
        expect(resGet.status).toBe(200);
        //res body should be a JSON constructed from the NetworkDTO
        //check on all fields + overall structure (i.e. no other fields, just the ones in the DTO)
        expect(resGet.body).toBeDefined();
        expect(resGet.body.length).toBe(TEST_NETWORKS.length + 2);
        expect(resGet.body[TEST_NETWORKS.length].code).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length].code).toBe("testNetworkCode2fulle2e");
        expect(resGet.body[TEST_NETWORKS.length].name).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length].name).toBe("Test Network2_fulle2e");
        expect(resGet.body[TEST_NETWORKS.length].description).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length].description).toBe("Test Description2_fulle2e");
        expect(resGet.body[TEST_NETWORKS.length+1].code).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length+1].code).toBe("testNetworkCode3fulle2e");
        expect(resGet.body[TEST_NETWORKS.length+1].name).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length+1].name).toBe("Test Network3_fulle2e");
        expect(resGet.body[TEST_NETWORKS.length+1].description).toBeDefined();
        expect(resGet.body[TEST_NETWORKS.length+1].description).toBe("Test Description3_fulle2e");
    });

    it("get all networks - 401 Unauthorized (Admin)", async () => {
        //url is /api/v1/networks
        //request params are empty
        //request body is empty
        //since admin can get all networks, the request should be successful

        const resGet = await request(app)
            .get(CONFIG.ROUTES.V1_NETWORKS)
            .set("Authorization", `Bearer ${tokenAdmin}invalid_or_expired`);

        //res should return status 401
        expect(resGet.status).toBe(401);
        expect(resGet.body.message).toMatch(/Unauthorized/);

    });

});

describe(`PATCH - ${CONFIG.ROUTES.V1_NETWORKS} (e2e)`, () => {
    //generate tokens for the test users
    let tokenAdmin: string;
    let tokenOperator: string;
    let tokenViewer: string;

    beforeAll(async () => {
        await beforeAllE2e();
        tokenAdmin = generateToken(TEST_USERS.admin);
        tokenOperator = generateToken(TEST_USERS.operator);
        tokenViewer = generateToken(TEST_USERS.viewer);

        //create a network for the tests
        const testReqBody = {
            code: "testNetworkCode2fulle2e",
            name: "Test Network2_fulle2e",
            description: "Test Description2_fulle2e"
        };
        const res = await request(app)
            .post(CONFIG.ROUTES.V1_NETWORKS)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(testReqBody);
        //res should return status 201 and no body
        expect(res.status).toBe(201);
        expect(res.body).toEqual({});
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("update a network - name, description (Admin)", async () => {
        //url is /api/v1/networks/testNetworkCode2_fulle2e
        //request params are empty
        //request body is {name: "Test Network2 Updated", description: "Test Description2 Updated"}
        //since admin can update a network, the request should be successful

        const testReqBody = {
            code: "testNetworkCode2fulle2e",
            name: "Test Network2 Updated_fulle2e",
            description: "Test Description2 Updated_fulle2e"
        };

        const res = await request(app)
            .patch(`${CONFIG.ROUTES.V1_NETWORKS}/${testReqBody.code}`)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(testReqBody);

        //res should return status 204 and no body
        expect(res.status).toBe(204);
        expect(res.body).toEqual({});
        //now try to get the network, use the same code as above
        const resGet = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/${testReqBody.code}`)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        //res should return status 200 and the network
        expect(resGet.status).toBe(200);
        //res body should be a JSON constructed from the NetworkDTO
        //check on all fields + overall structure (i.e. no other fields, just the ones in the DTO)
        expect(resGet.body).toBeDefined();
        expect(resGet.body).toEqual(testReqBody);
        //manual check on all fields
        expect(resGet.body.code).toBeDefined();
        expect(resGet.body.code).toBe(testReqBody.code);
        expect(resGet.body.name).toBeDefined();
        expect(resGet.body.name).toBe(testReqBody.name);
        expect(resGet.body.description).toBeDefined();
        expect(resGet.body.description).toBe(testReqBody.description);
    });

    it("update a network - name, description (Operator)", async () => {
        //url is /api/v1/networks/testNetworkCode2_fulle2e
        //request params are empty
        //request body is {name: "Test Network2 Updated", description: "Test Description2 Updated"}
        //since operator can update a network, the request should be successful

        const testReqBody = {
            code: "testNetworkCode2fulle2e",
            name: "Test Network2 Updated_fulle2e",
            description: "Test Description2 Updated_fulle2e"
        };

        const res = await request(app)
            .patch(`${CONFIG.ROUTES.V1_NETWORKS}/${testReqBody.code}`)
            .set("Authorization", `Bearer ${tokenOperator}`)
            .send(testReqBody);

        //res should return status 204 and no body
        expect(res.status).toBe(204);
        expect(res.body).toEqual({});
        //now try to get the network, use the same code as above
        const resGet = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/${testReqBody.code}`)
            .set("Authorization", `Bearer ${tokenOperator}`);

        //res should return status 200 and the network
        expect(resGet.status).toBe(200);
        //res body should be a JSON constructed from the NetworkDTO
        //check on all fields + overall structure (i.e. no other fields, just the ones in the DTO)
        expect(resGet.body).toBeDefined();
        expect(resGet.body).toEqual(testReqBody);
        //manual check on all fields
        expect(resGet.body.code).toBeDefined();
        expect(resGet.body.code).toBe(testReqBody.code);
        expect(resGet.body.name).toBeDefined();
        expect(resGet.body.name).toBe(testReqBody.name);
        expect(resGet.body.description).toBeDefined();
        expect(resGet.body.description).toBe(testReqBody.description);
    });

    it("update a network - name, description (Viewer)", async () => {
        //url is /api/v1/networks/testNetworkCode2_fulle2e
        //request params are empty
        //request body is {name: "Test Network2 Updated", description: "Test Description2 Updated"}
        //since viewer CANNOT update a network, the request should fail with 403

        const testReqBody = {
            code: "testNetworkCode2fulle2e",
            name: "Test Network2 Updated_fulle2e",
            description: "Test Description2 Updated_fulle2e"
        };

        const res = await request(app)
            .patch(`${CONFIG.ROUTES.V1_NETWORKS}/${testReqBody.code}`)
            .set("Authorization", `Bearer ${tokenViewer}`)
            .send(testReqBody);

        //res should return status 403 and no body
        expect(res.status).toBe(403);
        expect(res.body).toBeDefined();
        expect(res.body.message).toMatch(/Forbidden: Insufficient rights/);
        expect(res.body.name).toBe("InsufficientRightsError");
        expect(res.body.code).toBe(403);

    });

    it("update a network - networkCode (Admin)", async () => {
        //url is /api/v1/networks/testNetworkCode2_fulle2e
        //request params are empty
        //request body is {code: "testNetworkCode2 Updated"}
        //since admin can update a network, the request should be successful

        const testReqBody = {
            code: "testNetworkCode2Updatedfulle2e",
            name: "Test Network2_fulle2e",
            description: "Test Description2_fulle2e"
        };

        const res = await request(app)
            .patch(`${CONFIG.ROUTES.V1_NETWORKS}/testNetworkCode2fulle2e`)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(testReqBody);

        //res should return status 204 and no body
        expect(res.status).toBe(204);
        expect(res.body).toEqual({});
        //now try to get the network, use the same code as above
        const resGet = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/${testReqBody.code}`)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        //res should return status 200 and the network
        expect(resGet.status).toBe(200);
        //res body should be a JSON constructed from the NetworkDTO
        //check on all fields + overall structure (i.e. no other fields, just the ones in the DTO)
        expect(resGet.body).toBeDefined();
        expect(resGet.body).toEqual(testReqBody);
        //manual check on all fields
        expect(resGet.body.code).toBeDefined();
        expect(resGet.body.code).toBe(testReqBody.code);
        expect(resGet.body.name).toBeDefined();
        expect(resGet.body.name).toBe(testReqBody.name);
        expect(resGet.body.description).toBeDefined();
        expect(resGet.body.description).toBe(testReqBody.description);

        //now expect the old code to NOT exist anymore
        const resGetOld = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/testNetworkCode2_fulle2e`)
            .set("Authorization", `Bearer ${tokenAdmin}`);
        //res should return status 404 and no body
        expect(resGetOld.status).toBe(404);
        expect(resGetOld.body).toBeDefined();
    });

    it("update a network - 400 Bad Request (Admin)", async () => {
        //url is /api/v1/networks/testNetworkCode2_fulle2e
        //request params are empty
        //request body is {code: 11} //invalid type
        //since admin can update a network, the request should fail with 400

        const testReqBody = {
            code: 11, //invalid type
            name: "Test Network2Updatedfulle2e",
            description: "Test Description2 Updated_fulle2e"
        };

        const res = await request(app)
            .patch(`${CONFIG.ROUTES.V1_NETWORKS}/testNetworkCode2_fulle2e`)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(testReqBody);

        //res should return status 400
        expect(res.status).toBe(400);
        expect(res.body).toBeDefined();


        const testReqBody2 = {
            code: "testNetworkCode2Updatedfulle2e",
            name: "Test Network2 Updated_fulle2e",
            description: [1, 2, 3] //invalid type
        };

        const res2 = await request(app)
            .patch(`${CONFIG.ROUTES.V1_NETWORKS}/testNetworkCode2_fulle2e`)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(testReqBody2);
        //res should return status 400
        expect(res2.status).toBe(400);
        expect(res2.body).toBeDefined();


    });


    it("update a network - 401 Unauthorized (Admin)", async () => {
        //url is /api/v1/networks/testNetworkCode2_fulle2e
        //request params are empty
        //request body is {code: "testNetworkCode2 Updated"}
        //since admin can update a network, the request should be successful

        const testReqBody = {
            code: "testNetworkCode2Updatedfulle2e",
            name: "Test Network2_fulle2e",
            description: "Test Description2_fulle2e"
        };

        const res = await request(app)
            .patch(`${CONFIG.ROUTES.V1_NETWORKS}/testNetworkCode2_fulle2e`)
            .set("Authorization", `Bearer ${tokenAdmin}invalid_or_expired`)
            .send(testReqBody);

        //res should return status 401
        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Unauthorized/);

    });

    it("update a network - 404 Not Found (Admin)", async () => {
        //url is /api/v1/networks/testNetworkCode2_fulle2e
        //request params are empty
        //request body is {code: "testNetworkCode2 Updated"}
        //since admin can update a network, the request should be successful

        const testReqBody = {
            description: "TestDescription2Updated fulle2e"
        };

        const res = await request(app)
            .patch(`${CONFIG.ROUTES.V1_NETWORKS}/testNetworkCode2_fulle2e_notFound`)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(testReqBody);

        //res should return status 404
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Entity not found/);

    });

    it("update a network - 409 Conflict (Admin)", async () => {
        //url is /api/v1/networks/testNetworkCode2_fulle2e
        //request params are empty
        //request body is {code: "NET01"} //this code already exists in the DB
        //since admin can update a network, the request should fail with 409

        const testReqBody = {
            code: "NET01", //this code already exists in the DB
            name: "Test Network2 Updated_fulle2e",
            description: "Test Description2 Updated_fulle2e"
        };

        const res = await request(app)
            .patch(`${CONFIG.ROUTES.V1_NETWORKS}/testNetworkCode2_fulle2e`)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(testReqBody);

        //res should return status 409
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/Entity with code .* already exists/);

    });
        
});

describe(`DELETE - ${CONFIG.ROUTES.V1_NETWORKS} (e2e)`, () => {
    //generate tokens for the test users
    let tokenAdmin: string;
    let tokenOperator: string;
    let tokenViewer: string;

    beforeAll(async () => {
        await beforeAllE2e();
        tokenAdmin = generateToken(TEST_USERS.admin);
        tokenOperator = generateToken(TEST_USERS.operator);
        tokenViewer = generateToken(TEST_USERS.viewer);

        //create a network for the tests
        const testReqBody = {
            code: "testNetworkCode2fulle2e",
            name: "Test Network2_fulle2e",
            description: "Test Description2_fulle2e"
        };
        const res = await request(app)
            .post(CONFIG.ROUTES.V1_NETWORKS)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(testReqBody);
        //res should return status 201 and no body
        expect(res.status).toBe(201);
        expect(res.body).toEqual({});
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("delete a network (Admin)", async () => {
        //url is /api/v1/networks/testNetworkCode2_fulle2e
        //request params are empty
        //request body is empty
        //since admin can delete a network, the request should be successful

        const res = await request(app)
            .delete(`${CONFIG.ROUTES.V1_NETWORKS}/testNetworkCode2fulle2e`)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        //res should return status 204 and no body
        expect(res.status).toBe(204);
        expect(res.body).toEqual({});

        //now try to get the network, use the same code as above
        const resGet = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/testNetworkCode2fulle2e`)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        //res should return status 404 and no body
        expect(resGet.status).toBe(404);
        expect(resGet.body).toBeDefined();

        //now try to get the network, use the same code as above
        const resGetOld = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/testNetworkCode2_fulle2e`)
            .set("Authorization", `Bearer ${tokenAdmin}`);
        //res should return status 404
        expect(resGetOld.status).toBe(404);
        expect(resGetOld.body.message).toMatch(/Entity not found/);
    });

    it("delete a network (Operator)", async () => {
        //url is /api/v1/networks/testNetworkCode2_fulle2e
        //request params are empty
        //request body is empty
        //since operator can delete a network, the request should be successful

        const res = await request(app)
            .delete(`${CONFIG.ROUTES.V1_NETWORKS}/testNetworkCode2_fulle2e`)
            .set("Authorization", `Bearer ${tokenOperator}`);

        //since the network was already deleted by the admin, the request should fail with 404
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Entity not found/);

        //now to delete NET01
        const res2 = await request(app)
            .delete(`${CONFIG.ROUTES.V1_NETWORKS}/NET01`)
            .set("Authorization", `Bearer ${tokenOperator}`);

        //res should return status 204 and no body
        expect(res2.status).toBe(204);
        expect(res2.body).toEqual({});

        //now try to get the network, use the same code as above
        const resGet = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/NET01`)
            .set("Authorization", `Bearer ${tokenOperator}`);

        //res should return status 404
        expect(resGet.status).toBe(404);
        expect(resGet.body.message).toMatch(/Entity not found/);

        
    });

    it("delete a network (Viewer)", async () => {
        //url is /api/v1/networks/testNetworkCode2_fulle2e
        //request params are empty
        //request body is empty
        //since viewer CANNOT delete a network, the request should fail with 403

        const res = await request(app)
            .delete(`${CONFIG.ROUTES.V1_NETWORKS}/testNetworkCode2_fulle2e`)
            .set("Authorization", `Bearer ${tokenViewer}`);

        //res should return status 403 and no body
        expect(res.status).toBe(403);
        expect(res.body).toBeDefined();
        expect(res.body.message).toMatch(/Forbidden: Insufficient rights/);
        expect(res.body.name).toBe("InsufficientRightsError");
        expect(res.body.code).toBe(403);

    });

    it("delete a network - 401 Unauthorized (Admin)", async () => {
        //url is /api/v1/networks/testNetworkCode2_fulle2e
        //request params are empty
        //request body is empty
        //since admin can delete a network, the request should be successful

        const res = await request(app)
            .delete(`${CONFIG.ROUTES.V1_NETWORKS}/testNetworkCode2_fulle2e`)
            .set("Authorization", `Bearer ${tokenAdmin}invalid_or_expired`);

        //res should return status 401
        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Unauthorized/);

    });

    it("delete a network - 404 Not Found (Admin)", async () => {
        //url is /api/v1/networks/testNetworkCode2_fulle2e
        //request params are empty
        //request body is empty
        //since admin can delete a network, the request should be successful

        const res = await request(app)
            .delete(`${CONFIG.ROUTES.V1_NETWORKS}/testNetworkCode2_fulle2e`)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        //not found, since the network was already deleted
        expect(res.status).toBe(404);
        expect(res.body).toBeDefined();
    });

});