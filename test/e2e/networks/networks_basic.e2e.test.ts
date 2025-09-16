/**
 * Networks.e2e.test.ts
 * Creation date: 2025-05-16
 * Last revision date: 2025-05-16
 * SWE Group 54
 */

//NOT FULL, JUST TO TEST THE STACK ONCE 

import request from "supertest";
import { app } from "@app"; //this is the REAL express server
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS, TEST_NETWORKS } from "@test/e2e/lifecycle";
import { CONFIG } from "@config";


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
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    it("get network (Admin)", async () => {

        const res = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/NET01`)
            .set("Authorization", `Bearer ${tokenAdmin}`);
       
        console.log(res.body);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("code");
        expect(res.body).toHaveProperty("name");
        expect(res.body).toHaveProperty("description");
        expect(res.body.code).toBeDefined();
        expect(res.body.name).toBeDefined();
        expect(res.body.description).toBeDefined();
        expect(res.body.code).toBe(TEST_NETWORKS.network1.networkCode);
        expect(res.body.name).toBe(TEST_NETWORKS.network1.networkName);
        expect(res.body.description).toBe(TEST_NETWORKS.network1.networkDescription);     
    });

    it("get network (Operator)", async () => {

        const res = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/NET01`)
            .set("Authorization", `Bearer ${tokenOperator}`);
       
        console.log(res.body);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("code");
        expect(res.body).toHaveProperty("name");
        expect(res.body).toHaveProperty("description");
        expect(res.body.code).toBeDefined();
        expect(res.body.name).toBeDefined();
        expect(res.body.description).toBeDefined();
        expect(res.body.code).toBe(TEST_NETWORKS.network1.networkCode);
        expect(res.body.name).toBe(TEST_NETWORKS.network1.networkName);
        expect(res.body.description).toBe(TEST_NETWORKS.network1.networkDescription);     
    });

    it("get network (Viewer)", async () => {

        const res = await request(app)
            .get(`${CONFIG.ROUTES.V1_NETWORKS}/NET01`)
            .set("Authorization", `Bearer ${tokenViewer}`);
       
        console.log(res.body);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("code");
        expect(res.body).toHaveProperty("name");
        expect(res.body).toHaveProperty("description");
        expect(res.body.code).toBeDefined();
        expect(res.body.name).toBeDefined();
        expect(res.body.description).toBeDefined();
        expect(res.body.code).toBe(TEST_NETWORKS.network1.networkCode);
        expect(res.body.name).toBe(TEST_NETWORKS.network1.networkName);
        expect(res.body.description).toBe(TEST_NETWORKS.network1.networkDescription);     
    });

    

});