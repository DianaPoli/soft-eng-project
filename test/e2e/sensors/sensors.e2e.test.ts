/**
 * Sensors.full.e2e.test.ts
 * Creation date: 2025-05-18
 * Last revision date: 2025-05-18
 * SWE Group 54
 */

import request from "supertest";
import { app } from "@app"; //this is the REAL express server
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS, TEST_NETWORKS, TEST_SENSORS, TEST_GATEWAYS } from "@test/e2e/lifecycle";
import { CONFIG } from "@config";

describe(`GET - ${CONFIG.ROUTES.V1_SENSORS}`, () => {
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


    it("get all sensors of a gateway - Admin", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac);
        
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveLength(TEST_SENSORS.length_NET1_gateway1);

        expect(response.body[0].macAddress).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        expect(response.body[0].name).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorName);
        expect(response.body[0].description).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorDescription);
        expect(response.body[0].variable).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorVariable);
        expect(response.body[0].unit).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorUnit);
        expect(response.body[1].macAddress).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorMac);
        expect(response.body[1].name).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorName);
        expect(response.body[1].description).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorDescription);
        expect(response.body[1].variable).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorVariable);
        expect(response.body[1].unit).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorUnit);
    });
    
    it("get all sensors of a gateway - Operator", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac);
        
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenOperator}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveLength(TEST_SENSORS.length_NET1_gateway1);

        expect(response.body[0].macAddress).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        expect(response.body[0].name).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorName);
        expect(response.body[0].description).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorDescription);
        expect(response.body[0].variable).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorVariable);
        expect(response.body[0].unit).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorUnit);
        expect(response.body[1].macAddress).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorMac);
        expect(response.body[1].name).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorName);
        expect(response.body[1].description).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorDescription);
        expect(response.body[1].variable).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorVariable);
        expect(response.body[1].unit).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorUnit);
    });

    it("get all sensors of a gateway - Admin", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac);
        
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenViewer}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveLength(TEST_SENSORS.length_NET1_gateway1);

        expect(response.body[0].macAddress).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        expect(response.body[0].name).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorName);
        expect(response.body[0].description).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorDescription);
        expect(response.body[0].variable).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorVariable);
        expect(response.body[0].unit).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorUnit);
        expect(response.body[1].macAddress).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorMac);
        expect(response.body[1].name).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorName);
        expect(response.body[1].description).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorDescription);
        expect(response.body[1].variable).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorVariable);
        expect(response.body[1].unit).toBe(TEST_SENSORS.sensor2_gateway1_Net1.sensorUnit);
    });

    it("get all sensors of a gateway - Unauthorized", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac);
        
        const response1 = await request(app)
            .get(url);
            //no token provided (ex. external internet user)
            //in this case it's rather the open API validator that will throw the error

        expect(response1.status).toBe(401);
        expect(response1.body).toBeDefined();


        //now try with an invalid token
        const response2 = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}invalid_or_expired`);

        expect(response2.status).toBe(401);
        expect(response2.body).toBeDefined();
        expect(response2.body.message).toMatch(/Unauthorized/);
    });

    it("get all sensors of a gateway - 404 NetworkCode Not Found", async () => {
        //use a non-existing network code
        const url = `${CONFIG.ROUTES.V1_SENSORS}`
            .replace(":networkCode", "non_existing_network_code")
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac);
        
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Entity not found/);
    });

    it("get all sensors of a gateway - 404 GatewayMac Not Found", async () => {
        //use a non-existing network code
        const url = `${CONFIG.ROUTES.V1_SENSORS}`
        .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", "non_existing_gateway_mac");
        
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Entity not found/);
    });

    it("get all sensors of a gateway - empty gateway", async () => {
        //NET03 is empty
        const url = `${CONFIG.ROUTES.V1_SENSORS}`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway2_Net2.gatewayMac);
        
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveLength(0); //0 gateways
    });

});


describe(`GET - ${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`, () => {
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


    it("get a specific sensor - Admin", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net2.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net2.sensorMac);
   
        console.log("Sensor URL:", url);
        
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);
                
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body.macAddress).toBe(TEST_SENSORS.sensor1_gateway1_Net2.sensorMac);
        expect(response.body.name).toBe(TEST_SENSORS.sensor1_gateway1_Net2.sensorName);
        expect(response.body.description).toBe(TEST_SENSORS.sensor1_gateway1_Net2.sensorDescription);
        expect(response.body.variable).toBe(TEST_SENSORS.sensor1_gateway1_Net2.sensorVariable);
        expect(response.body.unit).toBe(TEST_SENSORS.sensor1_gateway1_Net2.sensorUnit);
    });

    it("get a specific sensor - Operator", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        
        console.log("Sensor URL:", url);
        
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenOperator}`);
    
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body.macAddress).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        expect(response.body.name).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorName);
        expect(response.body.description).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorDescription);
        expect(response.body.variable).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorVariable);
        expect(response.body.unit).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorUnit);
    });
    

    it("get a specific sensor - Viewer", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        
        console.log("Sensor URL:", url);
        
        const response = await request(app)
            .get(url)
            .set("Authorization", `Bearer ${tokenViewer}`);
    
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body.macAddress).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        expect(response.body.name).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorName);
        expect(response.body.description).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorDescription);
        expect(response.body.variable).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorVariable);
        expect(response.body.unit).toBe(TEST_SENSORS.sensor1_gateway1_Net1.sensorUnit);
    });

    it("get a specific sensor - 401 Unauthorized", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
    
        const response1 = await request(app)
            .get(url)
            //no token provided (ex. external internet user)
            //in this case it's rather the open API validator that will throw the error
        
        expect(response1.status).toBe(401);
        expect(response1.body).toBeDefined();

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
        const url1 = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", "non_existing_network_code")
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
    
        const response = await request(app)
            .get(url1)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Entity not found/);


        //now use an existing network code and sensorMac but a non-existing gatewayMac
        const url2 = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", "non_existing_gateway_mac")
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
    
        const response2 = await request(app)
            .get(url2)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response2.status).toBe(404);
        expect(response2.body).toBeDefined();
        expect(response2.body.message).toMatch(/Entity not found/);


        //now use both a non-existing network code and a non-existing gatewayMac
        const url3 = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", "non_existing_network_code")
            .replace(":gatewayMac", "non_existing_gateway_mac")
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
    
        const response3 = await request(app)
            .get(url3)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response3.status).toBe(404);
        expect(response3.body).toBeDefined();
        expect(response3.body.message).toMatch(/Entity not found/);


        //now use both an existing network code and gatewayMac but a non-existing sensorMac
        const url4 = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", "non_existing_sensor_mac");
    
        const response4 = await request(app)
            .get(url4)
            .set("Authorization", `Bearer ${tokenAdmin}`);

        expect(response4.status).toBe(404);
        expect(response4.body).toBeDefined();
        expect(response4.body.message).toMatch(/Entity not found/);
    });
});


describe(`POST - ${CONFIG.ROUTES.V1_SENSORS}`, () => {
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


    it("create a new sensor - Admin", async () => {

        const url = `${CONFIG.ROUTES.V1_SENSORS}`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway2_Net2.gatewayMac);
        
        //create a new sensor
        const newSensor = {
            macAddress: "00:00:00:00:00:01",
            name: "New Sensor",
            description: "This is a new sensor",
            variable: "temperature",
            unit: "Celsius"
        };

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newSensor);


        expect(response.status).toBe(201);
        //no body in the response
        expect(response.body).toEqual({});

        //now check if the sensor is in the DB
        /*const url2 = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway2_Net2.gatewayMac)
            .replace(":sensorMac", newSensor.macAddress);
        const response2 = await request(app)
            .get(url2)
            .set("Authorization", `Bearer ${tokenAdmin}`);
        
        expect(response2.status).toBe(200);
        expect(response2.body).toBeDefined();
        expect(response2.body.macAddress).toBe(newSensor.macAddress);
        expect(response2.body.name).toBe(newSensor.name);
        expect(response2.body.description).toBe(newSensor.description);
        expect(response2.body.variable).toBe(newSensor.variable);
        expect(response2.body.unit).toBe(newSensor.unit);
        */
    });


    it("create a new sensor - Operator", async () => {

        const url = `${CONFIG.ROUTES.V1_SENSORS}`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway2_Net2.gatewayMac);
        
        //create a new sensor
        const newSensor = {
            macAddress: "00:00:00:00:00:02",
            name: "New Sensor",
            description: "This is a new sensor",
            variable: "temperature",
            unit: "Celsius"
        };

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenOperator}`)
            .send(newSensor);


        expect(response.status).toBe(201);
        //no body in the response
        expect(response.body).toEqual({});

        //now check if the sensor is in the DB
        /*const url2 = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway2_Net2.gatewayMac)
            .replace(":sensorMac", newSensor.macAddress);
        const response2 = await request(app)
            .get(url2)
            .set("Authorization", `Bearer ${tokenOperator}`);
        
        expect(response2.status).toBe(200);
        expect(response2.body).toBeDefined();
        expect(response2.body.macAddress).toBe(newSensor.macAddress);
        expect(response2.body.name).toBe(newSensor.name);
        expect(response2.body.description).toBe(newSensor.description);
        expect(response2.body.variable).toBe(newSensor.variable);
        expect(response2.body.unit).toBe(newSensor.unit);
        */
    });

    it("create a new sensor - Viewer", async () => {

        const url = `${CONFIG.ROUTES.V1_SENSORS}`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway2_Net2.gatewayMac);
        
        //create a new sensor
        const newSensor = {
            macAddress: "00:00:00:00:00:02",
            name: "New Sensor",
            description: "This is a new sensor",
            variable: "temperature",
            unit: "Celsius"
        };

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenViewer}`)
            .send(newSensor);


        expect(response.status).toBe(403);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Forbidden/);

    });

    it("create a new sensor - test nullable fields", async () => {

        const url = `${CONFIG.ROUTES.V1_SENSORS}`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway2_Net2.gatewayMac);
        
        //create a new sensor
        const newSensor = {
            macAddress: "00:00:00:00:00:03",
        };

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newSensor);


        expect(response.status).toBe(201);
        //no body in the response
        expect(response.body).toEqual({});

        //now check if the sensor is in the DB
        /*const url2 = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway2_Net2.gatewayMac)
            .replace(":sensorMac", newSensor.macAddress);
        const response2 = await request(app)
            .get(url2)
            .set("Authorization", `Bearer ${tokenAdmin}`);
        
        expect(response2.status).toBe(200);
        expect(response2.body).toBeDefined();
        expect(response2.body.macAddress).toBe(newSensor.macAddress);
        expect(response2.body.name).toBeUndefined();
        expect(response2.body.description).toBeUndefined();
        expect(response2.body.variable).toBeUndefined();
        expect(response2.body.unit).toBeUndefined();
        */
    });

    it("create a new sensor - 400 Bad Request", async () => {

        const url = `${CONFIG.ROUTES.V1_SENSORS}`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway2_Net2.gatewayMac);
        

        //simulate missing required fields
        const newSensor = {
            //macAddress: "00:00:00:00:00:03"
            name: "New Sensor",
            description: "This is a new sensor",
            variable: "temperature",
            unit: "Celsius"
        };

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newSensor);

        expect(response.status).toBe(400);
        expect(response.body).toBeDefined();

        //simulate invalid types
        const newSensor2 = {
            macAddress: 123,
            name: "New Sensor",
            description: "This is a new sensor",
            variable: "temperature",
            unit: "Celsius"
        };


        const response2 = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newSensor2);

        expect(response2.status).toBe(400);
        expect(response2.body).toBeDefined();


        const newSensor3 = {
            macAddress: "00:00:00:00:00:04",
            name: "New Sensor",
            description: ["This is a new sensor"],
            variable: "temperature",
            unit: "Celsius"
        };

        const response3 = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newSensor3);
        
        expect(response3.status).toBe(400);
        expect(response3.body).toBeDefined();

        const newSensor4 = {}; //empty request body

        const response4 = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newSensor4);
        
        expect(response4.status).toBe(400);
        expect(response4.body).toBeDefined();

    });

    it("create a new sensor - 401 Unauthorized", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway2_Net2.gatewayMac);
        

        const newSensor = {
            macAddress: "00:00:00:00:00:03",
            name: "New Sensor",
            description: "This is a new sensor",
            variable: "temperature",
            unit: "Celsius"
        };


        const response = await request(app)
            .post(url)
            .send(newSensor); //no token provided (ex. external internet user)
            //in this case it's rater the open API validator that will throw th


        expect(response.status).toBe(401);
        expect(response.body).toBeDefined();

        //now try with an invalid token
        const response2 = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}invalid_or_expired`)
            .send(newSensor);

        expect(response2.status).toBe(401);
        expect(response2.body).toBeDefined();
        expect(response2.body.message).toMatch(/Unauthorized/);
    });

    it("create a new sensor - 403 Insufficient rights", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway2_Net2.gatewayMac);
        

        const newSensor = {
            macAddress: "00:00:00:00:00:03",
            name: "New Sensor",
            description: "This is a new sensor",
            variable: "temperature",
            unit: "Celsius"
        };


        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenViewer}`)
            .send(newSensor);

        expect(response.status).toBe(403);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Forbidden/);
    });

    it("create a new sensor - 404 Not Found", async () => {
        
        const url = `${CONFIG.ROUTES.V1_SENSORS}`
            .replace(":networkCode", "non_existing_network_code")
            .replace(":gatewayMac", TEST_GATEWAYS.gateway2_Net2.gatewayMac);
        
        const newSensor = {
            macAddress: "03:03:03:03:03:03",
            name: "New Sensor",
            description: "This is a new sensor",
            variable: "temperature",
            unit: "Celsius"
        };


        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newSensor);

        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Entity not found/);
    });


    it("create a new sensor - 409 Conflict", async () => {
        
        const url = `${CONFIG.ROUTES.V1_SENSORS}`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac);
        
        const newSensor = {
            macAddress: "AA:BB:CC:DD:CC:01",
            name: "New Sensor",
            description: "This is a new sensor",
            variable: "temperature",
            unit: "Celsius"
        };


        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newSensor);

            expect(response.status).toBe(409);
            expect(response.body).toBeDefined();
            expect(response.body.message).toMatch(/Entity with code .* already exists/);
    });

    it("crare a new sensor - 409 Conflict - same mac address of an already existing gateway", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac);
        
        const newSensor = {
            macAddress: TEST_GATEWAYS.gateway1_Net1.gatewayMac, //same mac address of an already existing gw
            name: "New Sensor",
            description: "This is a new sensor",
            variable: "temperature",
            unit: "Celsius"
        };

        const response = await request(app)
            .post(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(newSensor);

        expect(response.status).toBe(409);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Entity with code .* already exists/);
    });

});


describe(`PATCH - ${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`, () => {
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
    it("update a sensor - Admin", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        
        //update the sensor
        const updatedSensor = {
            macAddress: "00:00:00:00:00:01",
            name: "Updated Sensor",
            description: "This is an updated sensor",
            variable: "humidity",
            unit: "percent"
        };

        const response = await request(app)
            .patch(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(updatedSensor);
        
        expect(response.status).toBe(204);
        //no body in the response
        expect(response.body).toEqual({});
        //now check if the sensor is updated in the DB
        /*const url2 = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", updatedSensor.macAddress);
        const response2 = await request(app)
            .get(url2)
            .set("Authorization", `Bearer ${tokenAdmin}`);
        expect(response2.status).toBe(200);
        expect(response2.body).toBeDefined();
        expect(response2.body.macAddress).toBe(updatedSensor.macAddress);
        expect(response2.body.name).toBe(updatedSensor.name);
        expect(response2.body.description).toBe(updatedSensor.description);
        expect(response2.body.variable).toBe(updatedSensor.variable);
        expect(response2.body.unit).toBe(updatedSensor.unit);
        */
    });    

    it("update a sensor - Operator", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net2.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net2.sensorMac);
        
        //update the sensor
        const updatedSensor = {
            macAddress: "00:00:00:00:00:03",
            name: "Updated Sensor",
            description: "This is an updated sensor",
            variable: "humidity",
            unit: "percent"
        };

        const response = await request(app)
            .patch(url)
            .set("Authorization", `Bearer ${tokenOperator}`)
            .send(updatedSensor);
        
        expect(response.status).toBe(204);
        //no body in the response
        expect(response.body).toEqual({});
        //now check if the sensor is updated in the DB
        /*const url2 = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", updatedSensor.macAddress);
        const response2 = await request(app)
            .get(url2)
            .set("Authorization", `Bearer ${tokenAdmin}`);
        expect(response2.status).toBe(200);
        expect(response2.body).toBeDefined();
        expect(response2.body.macAddress).toBe(updatedSensor.macAddress);
        expect(response2.body.name).toBe(updatedSensor.name);
        expect(response2.body.description).toBe(updatedSensor.description);
        expect(response2.body.variable).toBe(updatedSensor.variable);
        expect(response2.body.unit).toBe(updatedSensor.unit);
        */
    });    

    
    it("update a sensor - Viewer - 403 Insufficient Rights", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        
        //update the sensor
        const updatedSensor = {
            macAddress: "00:00:00:00:00:01",
            name: "Updated Sensor",
            description: "This is an updated sensor",
            variable: "humidity",
            unit: "percent"
        };

        const res = await request(app)
            .patch(url)
            .set("Authorization", `Bearer ${tokenViewer}`)
            .send(updatedSensor);
        
        expect(res.status).toBe(403);
        expect(res.body).toBeDefined();
        expect(res.body.message).toMatch(/Forbidden: Insufficient rights/);
        expect(res.body.name).toBe("InsufficientRightsError");
        expect(res.body.code).toBe(403);
    });    

    it("update a sensor - 400 Bad Request", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        
        //update the sensor
        const updatedSensor = {
            macAddress: 11111,
            name: "Updated Sensor",
            description: "This is an updated sensor",
            variable: "humidity",
            unit: "percent"
        };

        const res = await request(app)
            .patch(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(updatedSensor);
        
        expect(res.status).toBe(400);
        expect(res.body).toBeDefined();

        //update the sensor
        const updatedSensor2 = {
            macAddress: "00:00:00:00:00:05",
            name: 1111,
            description: "This is an updated sensor",
            variable: "humidity",
            unit: "percent"
        };

        const res2 = await request(app)
            .patch(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(updatedSensor2);
        
        expect(res2.status).toBe(400);
        expect(res2.body).toBeDefined();


        //update the sensor
        const updatedSensor3 = {
            macAddress: "00:00:00:00:00:05",
            name: "Updated Sensor",
            description: "This is an updated sensor",
            variable: [1,2,3],
            unit: "percent"
        };

        const res3 = await request(app)
            .patch(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(updatedSensor3);
        
        expect(res3.status).toBe(400);
        expect(res3.body).toBeDefined();
    });    

    it("update a sensor - 401 Unauthorized", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        
        //update the sensor
        const updatedSensor = {
            macAddress: "00:00:00:00:00:07",
            name: "Updated Sensor",
            description: "This is an updated sensor",
            variable: "humidity",
            unit: "percent"
        };

        const res = await request(app)
            .patch(url)
            .set("Authorization", `Bearer ${tokenAdmin}invalid_or_expired`)
            .send(updatedSensor);
        
        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Unauthorized/);
    });

    it("update a sensor - 404 Not Found", async () => {
        
        // Invalid network code
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", "non_existing_network_code")
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        
        //update the sensor
        const updatedSensor = {
            macAddress: "00:00:00:00:00:07",
            name: "Updated Sensor",
            description: "This is an updated sensor",
            variable: "humidity",
            unit: "percent"
        };

        const res = await request(app)
            .patch(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(updatedSensor);
        
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Entity not found/);

        // Invalid gateway mac
        const url2 = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", "non_existing_gateway_mac")
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        

        const res2 = await request(app)
            .patch(url2)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(updatedSensor);
        
        expect(res2.status).toBe(404);
        expect(res2.body.message).toMatch(/Entity not found/);


         // Invalid sensor mac
        const url3 = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", "non_existing_sensor_mac");
        

        const res3 = await request(app)
            .patch(url3)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(updatedSensor);
        
        expect(res3.status).toBe(404);
        expect(res3.body.message).toMatch(/Entity not found/);
    });

    it("update a sensor - 409 Conflict", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        
        //update the sensor
        const updatedSensor = {
            macAddress: "00:00:00:00:00:01", //this mac address already exists
            name: "Updated Sensor",
            description: "This is an updated sensor",
            variable: "humidity",
            unit: "percent"
        };

        const res = await request(app)
            .patch(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(updatedSensor);
        
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/Entity with code .* already exists/);
    
    });


    it("update a sensor - 409 Conflict - same mac address of an already existing gateway", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        //update the sensor
        //this mac address is the same of an already existing gateway
        const updatedSensor = {
            macAddress: TEST_GATEWAYS.gateway1_Net1.gatewayMac //same mac address of an already existing gw
        };

        const res = await request(app)
            .patch(url)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send(updatedSensor);
        
        expect(res.status).toBe(409);
        expect(res.body).toBeDefined();
        expect(res.body.message).toMatch(/Entity with code .* already exists/);
    });
});




describe(`DELETE - ${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`, () => {
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
    it("delete a sensor - Admin", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        

        const response = await request(app)
            .delete(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);
        
        expect(response.status).toBe(204);
        //no body in the response
        expect(response.body).toEqual({});
        //now check if the sensor is deleted in the DB
        const url2 = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        const response2 = await request(app)
            .get(url2)
            .set("Authorization", `Bearer ${tokenAdmin}`);
        
        expect(response2.status).toBe(404);
        expect(response2.body).toBeDefined();
        expect(response2.body.message).toMatch(/Entity not found/);
        
    });    

    it("delete a sensor - Operator", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor2_gateway1_Net1.sensorMac);
        

        const response = await request(app)
            .delete(url)
            .set("Authorization", `Bearer ${tokenOperator}`);
        
        expect(response.status).toBe(204);
        //no body in the response
        expect(response.body).toEqual({});
        //now check if the sensor is deleted in the DB
        const url2 = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network1.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net1.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor1_gateway1_Net1.sensorMac);
        const response2 = await request(app)
            .get(url2)
            .set("Authorization", `Bearer ${tokenAdmin}`);
        
        expect(response2.status).toBe(404);
        expect(response2.body).toBeDefined();
        expect(response2.body.message).toMatch(/Entity not found/);
        
    });    

    it("delete a sensor - 403 Insufficient rights", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net2.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor3_gateway1_Net2.sensorMac);
        

        const response = await request(app)
            .delete(url)
            .set("Authorization", `Bearer ${tokenViewer}`);
        
        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/Forbidden/);
        //now check if the sensor is deleted in the DB
        // const url2 = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
        //     .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
        //     .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net2.gatewayMac)
        //     .replace(":sensorMac", TEST_SENSORS.sensor3_gateway1_Net2.sensorMac);
        // const response2 = await request(app)
        //     .get(url2)
        //     .set("Authorization", `Bearer ${tokenAdmin}`);
        
        // expect(response2.status).toBe(200);
        // expect(response2.body).toBeDefined();
        
    }); 
    
    it("delete a sensor - 401 Insufficient rights", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net2.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor3_gateway1_Net2.sensorMac);
        

        const response = await request(app)
            .delete(url)
        
        expect(response.status).toBe(401);
        expect(response.body).toBeDefined();

        const response2 = await request(app)
            .delete(url)
            .set("Authorization", `Bearer ${tokenAdmin}invalid_or_expired`);

        expect(response2.status).toBe(401);
        expect(response2.body).toBeDefined();
        expect(response2.body.message).toMatch(/Unauthorized/);
    });

    it("delete a sensor - 404 Not Found", async () => {
        const url = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", "non_existing_network_code")
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net2.gatewayMac)
            .replace(":sensorMac", TEST_SENSORS.sensor3_gateway1_Net2.sensorMac);
        

        const response = await request(app)
            .delete(url)
            .set("Authorization", `Bearer ${tokenAdmin}`);
        
        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
        expect(response.body.message).toMatch(/Entity not found/);

        const url2 = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", "non_existing_gateway_mac")
            .replace(":sensorMac", TEST_SENSORS.sensor3_gateway1_Net2.sensorMac);
        

        const response2 = await request(app)
            .delete(url2)
            .set("Authorization", `Bearer ${tokenAdmin}`);
        
        expect(response2.status).toBe(404);
        expect(response2.body).toBeDefined();
        expect(response2.body.message).toMatch(/Entity not found/);

        const url3 = `${CONFIG.ROUTES.V1_SENSORS}/:sensorMac`
            .replace(":networkCode", TEST_NETWORKS.network2.networkCode)
            .replace(":gatewayMac", TEST_GATEWAYS.gateway1_Net2.gatewayMac)
            .replace(":sensorMac", "non_existing_sensor_mac");
        

        const response3 = await request(app)
            .delete(url3)
            .set("Authorization", `Bearer ${tokenAdmin}`);
        
        expect(response3.status).toBe(404);
        expect(response3.body).toBeDefined();
        expect(response3.body.message).toMatch(/Entity not found/);

    });
});