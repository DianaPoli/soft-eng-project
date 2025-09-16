import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as networkController from "@controllers/networkController";
import { Network as NetworkDTO, Gateway as GatewayDTO, Sensor as SensorDTO } from "@models/dto";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { UserType } from "@models/UserType";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

jest.mock("@services/authService");
jest.mock("@controllers/networkController");


describe("NetworkRoutes integration", () => {

    const token = "Bearer faketoken";

    afterEach(() => {
        jest.clearAllMocks();
    });


    it("get all networks - no nested entities", async () => {
        const mockNetworks: NetworkDTO[] = [
            { code: "net1", name: "Network 1", description: "Description 1" },
            { code: "net2", name: "Network 2", description: "Description 2" }
        ];

        //always authorized, for each type of user
        //i.e. in this case we mock the authService to say: "ok, you are authorized"
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (networkController.getAllNetworks as jest.Mock).mockResolvedValue(mockNetworks);

        const response = await request(app)
            .get("/api/v1/networks")
            .set("Authorization", token);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockNetworks);
        expect(authService.processToken).toHaveBeenCalledWith(token, [
            UserType.Admin, UserType.Operator, UserType.Viewer //this are the allowed types
        ]);
        expect(networkController.getAllNetworks).toHaveBeenCalled();
    });

    it("get all networks - nested entities", async () => {
        const mockNetworks: NetworkDTO[] = [
            {
                code: "net1",
                name: "Network 1",
                description: "Description 1",
                gateways: [
                    {
                        macAddress: "00:11:22:33:44:55",
                        name: "Gateway 1",
                        description: "Gateway 1 Description",
                        sensors: [
                            {
                                macAddress: "AA:BB:CC:DD:EE:FF",
                                name: "Sensor 1",
                                description: "Sensor 1 Description",
                                variable: "temperature",
                                unit: "Celsius"
                            } as SensorDTO
                        ]
                    } as GatewayDTO
                ]
            }
        ];

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (networkController.getAllNetworks as jest.Mock).mockResolvedValue(mockNetworks);

        const response = await request(app)
            .get("/api/v1/networks")
            .set("Authorization", token);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockNetworks);
        expect(authService.processToken).toHaveBeenCalledWith(token, [
            UserType.Admin, UserType.Operator, UserType.Viewer 
        ]);
        expect(networkController.getAllNetworks).toHaveBeenCalled();


    });

    it("get all network - 401 UnauthorizedError (invalid token)", async () => {
        //it's not that the user is not authorized vecause of their role, but that the token is invalid (i.e. expired)
        (authService.processToken as jest.Mock).mockImplementation(() => {
            throw new UnauthorizedError("Unauthorized: No token provided");
        });

        const response = await request(app)
            .get("/api/v1/networks")
            .set("Authorization", "Bearer invalid");

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("get all networks - 500 InternalServerError", async () => {
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (networkController.getAllNetworks as jest.Mock).mockImplementation(() => {
            //Erro it general because it's just a simulation
            throw new Error("Internal server error");
        });

        const response = await request(app)
            .get("/api/v1/networks")
            .set("Authorization", token);

        expect(response.status).toBe(500);
    });


    it("get a network by code - no nested entities", async () => {
        const mockNetwork: NetworkDTO = {
            code: "net1",
            name: "Network 1",
            description: "Description 1"
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (networkController.getNetworkByNetworkCode as jest.Mock).mockResolvedValue(mockNetwork);

        const response = await request(app)
            .get("/api/v1/networks/net1")
            .set("Authorization", token);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockNetwork);
        expect(authService.processToken).toHaveBeenCalledWith(token, [
            UserType.Admin, UserType.Operator, UserType.Viewer 
        ]);
        expect(networkController.getNetworkByNetworkCode).toHaveBeenCalledWith(mockNetwork.code);
    });

    it("get a network by code - nested entities", async () => {
        const mockNetwork: NetworkDTO = {
            code: "net1",
            name: "Network 1",
            description: "Description 1",
            gateways: [
                {
                    macAddress: "00:11:22:33:44:55",
                    name: "Gateway 1",
                    description: "Gateway 1 Description",
                    sensors: [
                        {
                            macAddress: "AA:BB:CC:DD:EE:FF",
                            name: "Sensor 1",
                            description: "Sensor 1 Description",
                            variable: "temperature",
                            unit: "Celsius"
                        } as SensorDTO
                    ]
                } as GatewayDTO
            ]
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (networkController.getNetworkByNetworkCode as jest.Mock).mockResolvedValue(mockNetwork);

        const response = await request(app)
            .get("/api/v1/networks/net1")
            .set("Authorization", token);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockNetwork);
        expect(authService.processToken).toHaveBeenCalledWith(token, [
            UserType.Admin, UserType.Operator, UserType.Viewer 
        ]);
        expect(networkController.getNetworkByNetworkCode).toHaveBeenCalledWith(mockNetwork.code);
    });

    it("get a network by code - 401 UnauthorizedError (invalid token)", async () => {
        (authService.processToken as jest.Mock).mockImplementation(() => {
            throw new UnauthorizedError("Unauthorized: No token provided");
        });

        const response = await request(app)
            .get("/api/v1/networks/net1")
            .set("Authorization", "Bearer invalid");

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("get a network by code - 404 NotFoundError", async () => {
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (networkController.getNetworkByNetworkCode as jest.Mock).mockImplementation(() => {
            //this error is actually thrown by the REPOSITORY, then propagated to the CONTROLLER and through routes with next(error)
            throw new NotFoundError("Entity not found");
        });

        const response = await request(app)
            .get("/api/v1/networks/net1")
            .set("Authorization", token);

        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/Entity not found/);
    });


    it("create a new network", async () => {
        const mockNetwork: NetworkDTO = {
            code: "net1",
            name: "Network 1",
            description: "Description 1"
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (networkController.createNetwork as jest.Mock).mockResolvedValue(undefined);

        const response = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", token)
            .send(mockNetwork);

        expect(response.status).toBe(201);
        expect(authService.processToken).toHaveBeenCalledWith(token, [
            UserType.Admin, UserType.Operator //Viewer CANNOT create a network!
        ]);
        expect(networkController.createNetwork).toHaveBeenCalledWith(mockNetwork);
    });

    it("create network - 400 BadRequestError", async () => {
        //invalid input data
        //this check is handled by openapi-validator, how can we test it?
        const mockNetwork = {
            code: 1, //invalid type
            name: "Network 1",
            description: "Description 1"
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);

        const response = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", token)
            .send(mockNetwork);

        expect(response.status).toBe(400);


        const mockNetwork2 = {
            code: "rightCode",
            name: 2222, //invalid type
            description: "Description 1"
        }

        const response2 = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", token)
            .send(mockNetwork2);
        expect(response2.status).toBe(400);

        const mockNetwork3 = {
            code: "rightCode",
            name: "Network 1",
            description: [1, 2, 3] //invalid type
        }

        const response3 = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", token)
            .send(mockNetwork3);
        expect(response3.status).toBe(400);


        const mockNetwork4 = {
            code: "rightCode",
            name: "Network 1",
            description: "Description 1",
            gateways: [1, 2, 3] //invalid type
        }

        const response4 = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", token)
            .send(mockNetwork4);
        expect(response4.status).toBe(400);


        const mockNetwork5 = {
            code: "rightCode",
            name: "Network 1",
            description: "Description 1",
            gateways: [
                {
                    macAddress: "00:11:22:33:44:55",
                    name: 2222, //invalid type
                    description: "Gateway 1 Description"
                }
            ]
        }

        const response5 = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", token)
            .send(mockNetwork5);
        expect(response5.status).toBe(400);

        const mockNetwork6 = {
            code: "rightCode",
            name: "Network 1",
            description: "Description 1",
            gateways: [
                {
                    macAddress: "00:11:22:33:44:55",
                    name: "Gateway 1",
                    description: "Gateway 1 Description",
                    sensors: [1, 2, 3] //invalid type
                }
            ]
        }

        const response6 = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", token)
            .send(mockNetwork6);

        expect(response6.status).toBe(400);

        const mockNetwork7 = {
            code: "rightCode",
            name: "Network 1",
            description: "Description 1",
            gateways: [
                {
                    macAddress: "00:11:22:33:44:55",
                    name: "Gateway 1",
                    description: "Gateway 1 Description",
                    sensors: [
                        {
                            macAddress: "AA:BB:CC:DD:EE:FF",
                            name: 2222, //invalid type
                            description: "Sensor 1 Description",
                            variable: "temperature",
                            unit: "Celsius"
                        }
                    ]
                }
            ]
        }

        const response7 = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", token)
            .send(mockNetwork7);

        expect(response7.status).toBe(400);


        const mockNetwork8 = {
            code: "rightCode",
            name: "Network 1",
            description: "Description 1",
            gateways: [
                {
                    macAddress: "00:11:22:33:44:55",
                    name: "Gateway 1",
                    description: "Gateway 1 Description",
                    sensors: [
                        {
                            macAddress: "AA:BB:CC:DD:EE:FF",
                            name: "Sensor 1",
                            description: "Sensor 1 Description",
                            variable: 2222, //invalid type
                            unit: "Celsius"
                        }
                    ]
                }
            ]
        }

        const response8 = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", token)
            .send(mockNetwork8);
        expect(response8.status).toBe(400);
    });

    it("create network - 401 UnauthorizedError (invalid token)", async () => {
        const mockNetwork: NetworkDTO = {
            code: "net1",
            name: "Network 1",
            description: "Description 1"
        };

        (authService.processToken as jest.Mock).mockImplementation(() => {
            throw new UnauthorizedError("Unauthorized: No token provided");
        });

        const response = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", "Bearer invalid")
            .send(mockNetwork);

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("create network - 403 InsufficientRightsError", async () => {
        const mockNetwork: NetworkDTO = {
            code: "net1",
            name: "Network 1",
            description: "Description 1"
        };

        (authService.processToken as jest.Mock).mockImplementation(() => {
            //if for example the user is a VIEWER
            throw new InsufficientRightsError("Forbidden: Insufficient rights");
        });

        const response = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", token)
            .send(mockNetwork);

        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("create network - 409 ConflictError", async () => {
        const mockNetwork: NetworkDTO = {
            code: "net1",
            name: "Network 1",
            description: "Description 1"
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        //Suppose a network with the same code already exists
        //in this case the repository will throw a ConflictError
        //this will be propagated to the controller and then to the routes
        (networkController.createNetwork as jest.Mock).mockImplementation(() => {
            throw new ConflictError("Network with networkCode 'net1' already exists");
        });

        const response = await request(app)
            .post("/api/v1/networks")
            .set("Authorization", token)
            .send(mockNetwork);

        expect(response.status).toBe(409);
        expect(response.body.message).toMatch(/Network with networkCode 'net1' already exists/);
        expect(response.body.name).toMatch(/ConflictError/);
    });

    it("update a network", async () => {
        const mockNetwork: NetworkDTO = {
            code: "net1",
            name: "Network 1",
            description: "Description 1"
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (networkController.updateNetwork as jest.Mock).mockResolvedValue(undefined); //Promise<void> is returned 

        const response = await request(app)
            .patch("/api/v1/networks/net1")
            .set("Authorization", token)
            .send(mockNetwork);

        expect(response.status).toBe(204);
        expect(authService.processToken).toHaveBeenCalledWith(token, [
            UserType.Admin, UserType.Operator //Viewer CANNOT update a network!
        ]);
        expect(networkController.updateNetwork).toHaveBeenCalledWith(mockNetwork.code, mockNetwork);
    });

    it("update network - 400 BadRequestError", async () => {
        //invalid input data
        //this check is handled by openapi-validator, how can we test it?
        const mockNetwork = {
            code: 1, //invalid type
            name: "Network 1",
            description: "Description 1"
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);

        const response = await request(app)
            .patch("/api/v1/networks/net1")
            .set("Authorization", token)
            .send(mockNetwork);

        expect(response.status).toBe(400);

        const mockNetwork2 = {
            code: "rightCode",
            name: 2222, //invalid type
            description: "Description 1"
        }
        const response2 = await request(app)
            .patch("/api/v1/networks/net1")
            .set("Authorization", token)
            .send(mockNetwork2);
        expect(response2.status).toBe(400);

        const mockNetwork3 = {
            code: "rightCode",
            name: "Network 1",
            description: [1, 2, 3] //invalid type
        }

        const response3 = await request(app)
            .patch("/api/v1/networks/net1")
            .set("Authorization", token)
            .send(mockNetwork3);
        expect(response3.status).toBe(400);

        const mockNetwork4 = {
            code: "rightCode",
            name: "Network 1",
            description: "Description 1",
            gateways: [1, 2, 3] //invalid type
        }

        const response4 = await request(app)
            .patch("/api/v1/networks/net1")
            .set("Authorization", token)
            .send(mockNetwork4);
        expect(response4.status).toBe(400);

        const mockNetwork5 = {
            code: "rightCode",
            name: "Network 1",
            description: "Description 1",
            gateways: [
                {
                    macAddress: "00:11:22:33:44:55",
                    name: 2222, //invalid type
                    description: "Gateway 1 Description"
                }
            ]
        }

        const response5 = await request(app)
            .patch("/api/v1/networks/net1")
            .set("Authorization", token)
            .send(mockNetwork5);
        expect(response5.status).toBe(400);

        const mockNetwork6 = {
            code: "rightCode",
            name: "Network 1",
            description: "Description 1",
            gateways: [
                {
                    macAddress: "00:11:22:33:44:55",
                    name: "Gateway 1",
                    description: "Gateway 1 Description",
                    sensors: [1, 2, 3] //invalid type
                }
            ]
        }

        const response6 = await request(app)
            .patch("/api/v1/networks/net1")
            .set("Authorization", token)
            .send(mockNetwork6);
        expect(response6.status).toBe(400);

        const mockNetwork7 = {
            code: "rightCode",
            name: "Network 1",
            description: "Description 1",
            gateways: [
                {
                    macAddress: "00:11:22:33:44:55",
                    name: "Gateway 1",
                    description: "Gateway 1 Description",
                    sensors: [
                        {
                            macAddress: "AA:BB:CC:DD:EE:FF",
                            name: 2222, //invalid type
                            description: "Sensor 1 Description",
                            variable: "temperature",
                            unit: "Celsius"
                        }
                    ]
                }
            ]
        }
        const response7 = await request(app)
            .patch("/api/v1/networks/net1")
            .set("Authorization", token)
            .send(mockNetwork7);
        expect(response7.status).toBe(400);


        const mockNetwork8 = {
            code: "rightCode",
            name: "Network 1",
            description: "Description 1",
            gateways: [
                {
                    macAddress: "00:11:22:33:44:55",
                    name: "Gateway 1",
                    description: "Gateway 1 Description",
                    sensors: [
                        {
                            macAddress: "AA:BB:CC:DD:EE:FF",
                            name: "Sensor 1",
                            description: "Sensor 1 Description",
                            variable: 2222, //invalid type
                            unit: "Celsius"
                        }
                    ]
                }
            ]
        }

        const response8 = await request(app)
            .patch("/api/v1/networks/net1")
            .set("Authorization", token)
            .send(mockNetwork8);
        expect(response8.status).toBe(400);
    });

    it("update network - 401 UnauthorizedError (invalid token)", async () => {
        const mockNetwork: NetworkDTO = {
            code: "net1",
            name: "Network 1",
            description: "Description 1"
        };

        (authService.processToken as jest.Mock).mockImplementation(() => {
            throw new UnauthorizedError("Unauthorized: No token provided");
        });

        const response = await request(app)
            .patch("/api/v1/networks/net1")
            .set("Authorization", "Bearer invalid")
            .send(mockNetwork);

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("update network - 403 InsufficientRightsError", async () => {
        const mockNetwork: NetworkDTO = {
            code: "net1",
            name: "Network 1",
            description: "Description 1"
        };

        (authService.processToken as jest.Mock).mockImplementation(() => {
            //if for example the user is a VIEWER
            throw new InsufficientRightsError("Forbidden: Insufficient rights");
        });

        const response = await request(app)
            .patch("/api/v1/networks/net1")
            .set("Authorization", token)
            .send(mockNetwork);

        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("update network - 404 NotFoundError", async () => {
        const mockNetwork: NetworkDTO = {
            code: "net1",
            name: "Network 1",
            description: "Description 1"
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        //Suppose a network with the same code already exists
        //in this case the repository will throw a ConflictError
        //this will be propagated to the controller and then to the routes
        (networkController.updateNetwork as jest.Mock).mockImplementation(() => {
            throw new NotFoundError("Entity not found");
        });

        const response = await request(app)
            .patch("/api/v1/networks/net1")
            .set("Authorization", token)
            .send(mockNetwork);

        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/Entity not found/);
    });

    it("update network - 409 ConflictError", async () => {
        const mockNetwork: NetworkDTO = {
            code: "net1",
            name: "Network 1",
            description: "Description 1"
        };

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        //Suppose a network with the same code already exists
        //in this case the repository will throw a ConflictError
        //this will be propagated to the controller and then to the routes
        (networkController.updateNetwork as jest.Mock).mockImplementation(() => {
            throw new ConflictError("Entity with code 'net1' already exists");
        });

        const response = await request(app)
            .patch("/api/v1/networks/net1")
            .set("Authorization", token)
            .send(mockNetwork);

        expect(response.status).toBe(409);
        expect(response.body.message).toMatch(/Entity with code 'net1' already exists/);
        expect(response.body.name).toMatch(/ConflictError/);
    });


    it("delete a network", async () => {
        const mockNetworkCode = "net1";

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (networkController.deleteNetwork as jest.Mock).mockResolvedValue(undefined);

        const response = await request(app)
            .delete("/api/v1/networks/net1")
            .set("Authorization", token);

        expect(response.status).toBe(204);
        expect(authService.processToken).toHaveBeenCalledWith(token, [
            UserType.Admin, UserType.Operator //Viewer CANNOT delete a network!
        ]);
        expect(networkController.deleteNetwork).toHaveBeenCalledWith(mockNetworkCode);
    });

    it("delete network - 401 UnauthorizedError (invalid token)", async () => {
        const mockNetworkCode = "net1";

        (authService.processToken as jest.Mock).mockImplementation(() => {
            throw new UnauthorizedError("Unauthorized: No token provided");
        });

        const response = await request(app)
            .delete("/api/v1/networks/net1")
            .set("Authorization", "Bearer invalid");

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("delete network - 403 InsufficientRightsError", async () => {
        const mockNetworkCode = "net1";

        (authService.processToken as jest.Mock).mockImplementation(() => {
            //if for example the user is a VIEWER
            throw new InsufficientRightsError("Forbidden: Insufficient rights");
        });

        const response = await request(app)
            .delete("/api/v1/networks/net1")
            .set("Authorization", token);

        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/Insufficient rights/);
    });

    it("delete network - 404 NotFoundError", async () => {
        const mockNetworkCode = "net1";

        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        //Suppose a network with the same code already exists
        //in this case the repository will throw a ConflictError
        //this will be propagated to the controller and then to the routes
        (networkController.deleteNetwork as jest.Mock).mockImplementation(() => {
            throw new NotFoundError("Entity not found");
        });

        const response = await request(app)
            .delete("/api/v1/networks/net1")
            .set("Authorization", token);

        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/Entity not found/);
    });



});