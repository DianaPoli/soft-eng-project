import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkDAO } from "@dao/NetworkDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
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



describe("GatewayRepository: mocked database", () => {

    const repo = new GatewayRepository();

    beforeEach(() => {
        jest.clearAllMocks();
    });


    it("create gateway", async () => {
        //Mock the find method to return an empty array, no conflict with gateway to be created
        mockFind.mockResolvedValue([]);

        const savedGate = new GatewayDAO();
        //"gatewayMac", "Gateway Name", "Description 1", "networkCode"
        savedGate.gatewayMac = "11:11:11:11:11:11";
        savedGate.gatewayName = "Gateway Name";
        savedGate.gatewayDescription = "G Description 1";
        savedGate.network = new NetworkDAO();
        savedGate.network.networkCode = "networkCode1";
        savedGate.network.networkName = "Network Name";
        savedGate.network.networkDescription = "N Description 1";

        //Mock the save method to return the saved gateway
        mockSave.mockResolvedValue(savedGate);

        const mockNetwork = new NetworkDAO();
        mockNetwork.networkCode = "networkCode1";
        mockNetwork.networkName = "Network Name";
        mockNetwork.networkDescription = "N Description 1";

        mockFindOne.mockResolvedValue(mockNetwork);
        

        const savedGateReal = await repo.createGateway("networkCode1", "11:11:11:11:11:11", "Gateway Name", "G Description 1");

        //Now check that the saved gateway is the same as the one we created
        expect(savedGateReal).toBeDefined();
        expect(savedGateReal).toBeInstanceOf(GatewayDAO);
        //check params
        expect(savedGateReal.gatewayMac).toBe("11:11:11:11:11:11");
        expect(savedGateReal.gatewayName).toBe("Gateway Name");
        expect(savedGateReal.gatewayDescription).toBe("G Description 1");
        
        expect(savedGateReal.network).toBeDefined();
        expect(savedGateReal.network).toBeInstanceOf(NetworkDAO);
        expect(savedGateReal.network.networkCode).toBe("networkCode1");
        expect(savedGateReal.network.networkName).toBe("Network Name");
        expect(savedGateReal.network.networkDescription).toBe("N Description 1");


        //Check that the mockSave has been called with the correct parameters
        expect(mockSave).toHaveBeenCalledWith({
            gatewayMac: "11:11:11:11:11:11",
            gatewayName: "Gateway Name",
            gatewayDescription: "G Description 1",
            network: mockNetwork
        });

    });


    it("create gateway with existing gatewayMac - ConflictError thrown", async () => {

        //Now simulate a gateway with the same gatewayMac already in the database
        const alreadyPresentGate = new GatewayDAO();
        alreadyPresentGate.gatewayMac = "11:11:11:11:11:11";
        alreadyPresentGate.gatewayName = "Gateway Name";
        alreadyPresentGate.gatewayDescription = "G Description 1";
        alreadyPresentGate.network = new NetworkDAO();
        alreadyPresentGate.network.networkCode = "networkCode1";
        alreadyPresentGate.network.networkName = "Network Name";
        alreadyPresentGate.network.networkDescription = "N Description 1";

        mockFind.mockResolvedValue([alreadyPresentGate]);


        //Now try to create a new gateway inserting the same gatewayMac
        //A ConflictError should be thrown

        await expect(repo.createGateway("networkCode1", "11:11:11:11:11:11", "Gateway Name", "G Description 1")).rejects.toThrow(ConflictError);


    });

    it("create gateway without existing networkCode - NotFoundError thrown", async () => {

        //Mock the find method to return an empty array, no conflict with gateway to be created
        mockFind.mockResolvedValue([]);

        //Now simulate a net with the same networkCode not present in the database
        mockFindOne.mockResolvedValue(undefined)

        //Now try to create a new gateway inserting a networkCode not present in the database
        //A NotFoundError should be thrown

        await expect(repo.createGateway("networkCode1", "11:11:11:11:11:11", "Gateway Name", "G Description 1")).rejects.toThrow(NotFoundError);

    });

    it("get all gateways", async () => {

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

        const findRes = [gateway1, gateway2];

        mockFind.mockResolvedValue(findRes);


        const allGateReal = await repo.getAllGateways(true);
        //check they correspond to the ones we created before
        expect(allGateReal).toBeDefined();
        expect(allGateReal.length).toBe(2);
        expect(allGateReal[0].gatewayMac).toBe("11:11:11:11:11:11");
        expect(allGateReal[0].gatewayName).toBe("Gateway Name 1");
        expect(allGateReal[0].gatewayDescription).toBe("G Description 1");

        expect(allGateReal[0].network).toBeDefined();
        expect(allGateReal[0].network).toBeInstanceOf(NetworkDAO);
        expect(allGateReal[0].network.networkCode).toBe("networkCode1");
        expect(allGateReal[0].network.networkName).toBe("Network Name");
        expect(allGateReal[0].network.networkDescription).toBe("Description 1");


        expect(allGateReal[1].gatewayMac).toBe("22:22:22:22:22:22");
        expect(allGateReal[1].gatewayName).toBe("Gateway Name 2");
        expect(allGateReal[1].gatewayDescription).toBe("G Description 2");

        expect(allGateReal[1].network).toBeDefined();
        expect(allGateReal[1].network).toBeInstanceOf(NetworkDAO);
        expect(allGateReal[1].network.networkCode).toBe("networkCode1");
        expect(allGateReal[1].network.networkName).toBe("Network Name");
        expect(allGateReal[1].network.networkDescription).toBe("Description 1");

        expect(mockFind).toHaveBeenCalledWith({
            relations: ["network", "sensors"]
        });
    });

    it("get all gateways - without loading network", async () => {

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

        const findRes = [gateway1, gateway2];

        mockFind.mockResolvedValue(findRes);


        const allGateReal = await repo.getAllGateways(false);
        //check they correspond to the ones we created before
        expect(allGateReal).toBeDefined();
        expect(allGateReal.length).toBe(2);
        expect(allGateReal[0].gatewayMac).toBe("11:11:11:11:11:11");
        expect(allGateReal[0].gatewayName).toBe("Gateway Name 1");
        expect(allGateReal[0].gatewayDescription).toBe("G Description 1");

        expect(allGateReal[0].network).toBeDefined();
        expect(allGateReal[0].network).toBeInstanceOf(NetworkDAO);
        expect(allGateReal[0].network.networkCode).toBe("networkCode1");
        expect(allGateReal[0].network.networkName).toBe("Network Name");
        expect(allGateReal[0].network.networkDescription).toBe("Description 1");


        expect(allGateReal[1].gatewayMac).toBe("22:22:22:22:22:22");
        expect(allGateReal[1].gatewayName).toBe("Gateway Name 2");
        expect(allGateReal[1].gatewayDescription).toBe("G Description 2");

        expect(allGateReal[1].network).toBeDefined();
        expect(allGateReal[1].network).toBeInstanceOf(NetworkDAO);
        expect(allGateReal[1].network.networkCode).toBe("networkCode1");
        expect(allGateReal[1].network.networkName).toBe("Network Name");
        expect(allGateReal[1].network.networkDescription).toBe("Description 1");

        expect(mockFind).toHaveBeenCalledWith({
            relations: ["sensors"]
        });
    });

    it("get all gateways: empty list", async () => {
        //suppose there are no gateways in the db
        //the find method should return an empty array
        mockFind.mockResolvedValue([]);


        const allGateReal = await repo.getAllGateways();
        //check they correspond to the ones we created before
        expect(allGateReal).toBeDefined();
        expect(allGateReal.length).toBe(0);
        expect(allGateReal).toEqual([]);

    });


    it("get all gateways by network code", async () => {

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

        // Mock: first findOne (check network exists), then find (gateways list)
        mockFindOne.mockResolvedValue(existingNet);


        const findRes = [gateway1, gateway2];

        mockFind.mockResolvedValue(findRes);


        const allGateReal = await repo.getAllGatewaysByNetworkCode("networkCode1", true);

        //check they correspond to the ones we created before
        expect(allGateReal).toBeDefined();
        expect(allGateReal.length).toBe(2);
        
        expect(allGateReal[0].gatewayMac).toBe("11:11:11:11:11:11");
        expect(allGateReal[0].gatewayName).toBe("Gateway Name 1");
        expect(allGateReal[0].gatewayDescription).toBe("G Description 1");

        expect(allGateReal[0].network).toBeDefined();
        expect(allGateReal[0].network).toBeInstanceOf(NetworkDAO);
        expect(allGateReal[0].network.networkCode).toBe("networkCode1");
        expect(allGateReal[0].network.networkName).toBe("Network Name");
        expect(allGateReal[0].network.networkDescription).toBe("Description 1");


        expect(allGateReal[1].gatewayMac).toBe("22:22:22:22:22:22");
        expect(allGateReal[1].gatewayName).toBe("Gateway Name 2");
        expect(allGateReal[1].gatewayDescription).toBe("G Description 2");

        expect(allGateReal[1].network).toBeDefined();
        expect(allGateReal[1].network).toBeInstanceOf(NetworkDAO);
        expect(allGateReal[1].network.networkCode).toBe("networkCode1");
        expect(allGateReal[1].network.networkName).toBe("Network Name");
        expect(allGateReal[1].network.networkDescription).toBe("Description 1");

        expect(mockFind).toHaveBeenCalledWith({
            where: {
                network: { networkCode: "networkCode1" }
            },
            relations: ["network", "sensors"] //always eagerly load the network and sensors relation
        });
    });

    it("get all gateways by network code - without loading network", async () => {

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

        // Mock: first findOne (check network exists), then find (gateways list)
        mockFindOne.mockResolvedValue(existingNet);


        const findRes = [gateway1, gateway2];

        mockFind.mockResolvedValue(findRes);


        const allGateReal = await repo.getAllGatewaysByNetworkCode("networkCode1", false);

        //check they correspond to the ones we created before
        expect(allGateReal).toBeDefined();
        expect(allGateReal.length).toBe(2);
        
        expect(allGateReal[0].gatewayMac).toBe("11:11:11:11:11:11");
        expect(allGateReal[0].gatewayName).toBe("Gateway Name 1");
        expect(allGateReal[0].gatewayDescription).toBe("G Description 1");

        expect(allGateReal[0].network).toBeDefined();
        expect(allGateReal[0].network).toBeInstanceOf(NetworkDAO);
        expect(allGateReal[0].network.networkCode).toBe("networkCode1");
        expect(allGateReal[0].network.networkName).toBe("Network Name");
        expect(allGateReal[0].network.networkDescription).toBe("Description 1");


        expect(allGateReal[1].gatewayMac).toBe("22:22:22:22:22:22");
        expect(allGateReal[1].gatewayName).toBe("Gateway Name 2");
        expect(allGateReal[1].gatewayDescription).toBe("G Description 2");

        expect(allGateReal[1].network).toBeDefined();
        expect(allGateReal[1].network).toBeInstanceOf(NetworkDAO);
        expect(allGateReal[1].network.networkCode).toBe("networkCode1");
        expect(allGateReal[1].network.networkName).toBe("Network Name");
        expect(allGateReal[1].network.networkDescription).toBe("Description 1");

        expect(mockFind).toHaveBeenCalledWith({
            where: {
                network: { networkCode: "networkCode1" }
            },
            relations: ["sensors"]
        });
    });

    it("get all gateways by network code: empty list", async () => {

        // Simulate an existing network
        const existingNet = new NetworkDAO();
        existingNet.networkCode = "networkCode1";
        existingNet.networkName = "Network Name";
        existingNet.networkDescription = "Description 1";


        // Mock: first findOne (check network exists), then find (gateways list)
        mockFindOne.mockResolvedValue(existingNet);
        mockFind.mockResolvedValue([]);

        const allGateReal = await repo.getAllGatewaysByNetworkCode("networkCode1", true);


        //check they correspond to the ones we created before
        expect(allGateReal).toBeDefined();
        expect(allGateReal.length).toBe(0);
        expect(allGateReal).toEqual([]);

        expect(mockFind).toHaveBeenCalledWith({
            where: {
                network: { networkCode: "networkCode1" }
            },
            relations: ["network", "sensors"] //always eagerly load the network and sensors relation
        });
    });

    it("get all gateways by network code: empty list - without loading network", async () => {

        // Simulate an existing network
        const existingNet = new NetworkDAO();
        existingNet.networkCode = "networkCode1";
        existingNet.networkName = "Network Name";
        existingNet.networkDescription = "Description 1";


        // Mock: first findOne (check network exists), then find (gateways list)
        mockFindOne.mockResolvedValue(existingNet);
        mockFind.mockResolvedValue([]);

        const allGateReal = await repo.getAllGatewaysByNetworkCode("networkCode1", false);


        //check they correspond to the ones we created before
        expect(allGateReal).toBeDefined();
        expect(allGateReal.length).toBe(0);
        expect(allGateReal).toEqual([]);

        expect(mockFind).toHaveBeenCalledWith({
            where: {
                network: { networkCode: "networkCode1" }
            },
            relations: ["sensors"] //always eagerly load the network and sensors relation
        });
    });

    it("get all gateways by non-existing networkCode - NotFoundError thrown", async () => {
        
        //Simulate a net with a non-existing networkCode
        mockFindOne.mockResolvedValue(undefined)

        //Now try to get all gateways inserting a networkCode not present in the database
        //A NotFoundError should be thrown

        await expect(repo.getAllGatewaysByNetworkCode("networkCode1")).rejects.toThrow(NotFoundError);

        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                networkCode: "networkCode1"
            }
        });
    
    });

    it("get gateway by network code and gateway mac", async () => {

        // Simulate an existing network
        const existingNet = new NetworkDAO();
        existingNet.networkCode = "networkCode1";
        existingNet.networkName = "Network Name";
        existingNet.networkDescription = "Description 1";

        // Simulate an existing gateway linked to that network
        const gateway = new GatewayDAO();
        gateway.gatewayMac = "11:11:11:11:11:11";
        gateway.gatewayName = "Gateway Name 1";
        gateway.gatewayDescription = "G Description 1";
        gateway.network = existingNet;


        // Mock: findOne
        mockFindOne.mockResolvedValue(gateway);

        const gateReal = await repo.getGatewayByNetworkCodeGatewayMac("networkCode1", "11:11:11:11:11:11", true);

        //check they correspond to the ones we created before
        expect(gateReal).toBeDefined();
        expect(gateReal).toBeInstanceOf(GatewayDAO);
        expect(gateReal.gatewayMac).toBe("11:11:11:11:11:11");
        expect(gateReal.gatewayName).toBe("Gateway Name 1");
        expect(gateReal.gatewayDescription).toBe("G Description 1");
        
        expect(gateReal.network).toBeDefined();
        expect(gateReal.network).toBeInstanceOf(NetworkDAO);
        expect(gateReal.network.networkCode).toBe("networkCode1");
        expect(gateReal.network.networkName).toBe("Network Name");
        expect(gateReal.network.networkDescription).toBe("Description 1");

        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                gatewayMac: "11:11:11:11:11:11",
                network: { networkCode: "networkCode1" }
            },
           relations: ["network", "sensors"] //always eagerly load the network and sensors relation
        });
    });

    it("get gateway by network code and gateway mac - without loading network", async () => {

        // Simulate an existing network
        const existingNet = new NetworkDAO();
        existingNet.networkCode = "networkCode1";
        existingNet.networkName = "Network Name";
        existingNet.networkDescription = "Description 1";

        // Simulate an existing gateway linked to that network
        const gateway = new GatewayDAO();
        gateway.gatewayMac = "11:11:11:11:11:11";
        gateway.gatewayName = "Gateway Name 1";
        gateway.gatewayDescription = "G Description 1";
        gateway.network = existingNet;


        // Mock: findOne
        mockFindOne.mockResolvedValue(gateway);

        const gateReal = await repo.getGatewayByNetworkCodeGatewayMac("networkCode1", "11:11:11:11:11:11", false);

        //check they correspond to the ones we created before
        expect(gateReal).toBeDefined();
        expect(gateReal).toBeInstanceOf(GatewayDAO);
        expect(gateReal.gatewayMac).toBe("11:11:11:11:11:11");
        expect(gateReal.gatewayName).toBe("Gateway Name 1");
        expect(gateReal.gatewayDescription).toBe("G Description 1");
        
        expect(gateReal.network).toBeDefined();
        expect(gateReal.network).toBeInstanceOf(NetworkDAO);
        expect(gateReal.network.networkCode).toBe("networkCode1");
        expect(gateReal.network.networkName).toBe("Network Name");
        expect(gateReal.network.networkDescription).toBe("Description 1");

        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                gatewayMac: "11:11:11:11:11:11",
                network: { networkCode: "networkCode1" }
            },
           relations: ["sensors"] //always eagerly load the network and sensors relation
        });
    });

    it("get gateway by network code and gateway mac - uses default loadNetwork=false", async () => {

        // Simulate an existing network
        const existingNet = new NetworkDAO();
        existingNet.networkCode = "networkCode1";
        existingNet.networkName = "Network Name";
        existingNet.networkDescription = "Description 1";

        // Simulate an existing gateway linked to that network
        const gateway = new GatewayDAO();
        gateway.gatewayMac = "11:11:11:11:11:11";
        gateway.gatewayName = "Gateway Name 1";
        gateway.gatewayDescription = "G Description 1";
        gateway.network = existingNet;


        // Mock: findOne
        mockFindOne.mockResolvedValue(gateway);

        const gateReal = await repo.getGatewayByNetworkCodeGatewayMac("networkCode1", "11:11:11:11:11:11");

        //check they correspond to the ones we created before
        expect(gateReal).toBeDefined();
        expect(gateReal).toBeInstanceOf(GatewayDAO);
        expect(gateReal.gatewayMac).toBe("11:11:11:11:11:11");
        expect(gateReal.gatewayName).toBe("Gateway Name 1");
        expect(gateReal.gatewayDescription).toBe("G Description 1");
        
        expect(gateReal.network).toBeDefined();
        expect(gateReal.network).toBeInstanceOf(NetworkDAO);
        expect(gateReal.network.networkCode).toBe("networkCode1");
        expect(gateReal.network.networkName).toBe("Network Name");
        expect(gateReal.network.networkDescription).toBe("Description 1");

        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                gatewayMac: "11:11:11:11:11:11",
                network: { networkCode: "networkCode1" }
            },
           relations: ["sensors"] //always eagerly load the network and sensors relation
        });
    });

    it("get gateway by non-existing network code and existing gateway mac - NotFoundError thrown", async () => {

        // Simulate a net with a non-existing networkCode
        mockFindOne.mockResolvedValue(undefined);

        //Now try to get a gateway inserting a networkCode not present in the database
        //A NotFoundError should be thrown
        await expect(repo.getGatewayByNetworkCodeGatewayMac("ghost", "11:11:11:11:11:11", true)).rejects.toThrow(NotFoundError);
        
        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                gatewayMac: "11:11:11:11:11:11",
                network: { networkCode: "ghost" }
            },
           relations: ["network", "sensors"] //always eagerly load the network and sensors relation
        });
    });

    it("get gateway by non-existing network code and existing gateway mac - NotFoundError thrown  - without loading network", async () => {

        // Simulate a net with a non-existing networkCode
        mockFindOne.mockResolvedValue(undefined);

        //Now try to get a gateway inserting a networkCode not present in the database
        //A NotFoundError should be thrown
        await expect(repo.getGatewayByNetworkCodeGatewayMac("ghost", "11:11:11:11:11:11", false)).rejects.toThrow(NotFoundError);
        
        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                gatewayMac: "11:11:11:11:11:11",
                network: { networkCode: "ghost" }
            },
           relations: ["sensors"] //always eagerly load the network and sensors relation
        });
    });

    it("get gateway by existing networkCode but non-existing gatewayMac - NotFoundError thrown", async () => {

        // Simulate valid network, but gatewayMac not found in that network
        mockFindOne.mockResolvedValue(undefined);
    
        await expect(repo.getGatewayByNetworkCodeGatewayMac("networkCode1", "non-existent-mac", true)).rejects.toThrow(NotFoundError);
    
        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                gatewayMac: "non-existent-mac",
                network: { networkCode: "networkCode1" }
            },
            relations: ["network", "sensors"]
        });
    });

    it("get gateway by existing networkCode but non-existing gatewayMac - NotFoundError thrown  - without loading network", async () => {

        // Simulate valid network, but gatewayMac not found in that network
        mockFindOne.mockResolvedValue(undefined);
    
        await expect(repo.getGatewayByNetworkCodeGatewayMac("networkCode1", "non-existent-mac", false)).rejects.toThrow(NotFoundError);
    
        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                gatewayMac: "non-existent-mac",
                network: { networkCode: "networkCode1" }
            },
            relations: ["sensors"]
        });
    });
    
    it("update gateway", async () => {
        //mockFind should not return a gateway, meaning the new gateway mac is ok
        mockFind.mockResolvedValue([]);


        //mockUpdate should return affected rows = 1, meaning the gateway was found and updated
        const mockUpdateResult: UpdateResult =  {
            raw: [], //not important for this test
            affected: 1,
            generatedMaps: [] //not important for this test
        }

        mockUpdate.mockResolvedValue(mockUpdateResult);

        //attempt to update the gateway
        const gateUpdate: Partial<GatewayDAO> = {
            gatewayMac: "22:22:22:22:22:22",
            gatewayName: "New Name",
            gatewayDescription: "New Description"
        };

        const updatedGate = await repo.updateGateway("networkCode1", "11:11:11:11:11:11", gateUpdate);

        //check that mockUpdate has been called with the correct parameters
        expect(mockUpdate).toHaveBeenCalledWith(
            {
                gatewayMac: "11:11:11:11:11:11",
                network: { networkCode : "networkCode1" }
            },
            gateUpdate
        );

        //Check that the mockFind has been called with the correct parameters
        expect(mockFind).toHaveBeenCalledWith({
            where : {
                gatewayMac: "22:22:22:22:22:22",
            }
        });
        
    });

    it("update gateway: conflict error", async () => {
        //simulate find returns an existing gateway
        //this means the new gateway mac is already in use
        //so a ConflictError should be thrown
        const existingGateway = new GatewayDAO(); //params are not important for this test
        existingGateway.gatewayMac = "22:22:22:22:22:22";

        mockFind.mockResolvedValue([existingGateway]);

        const gateUpdate: Partial<GatewayDAO> = {
            gatewayMac: "22:22:22:22:22:22", // changing to a conflicting MAC
            gatewayName: "New Name",
            gatewayDescription: "New Description"
        };

        await expect(repo.updateGateway("networkCode1", "11:11:11:11:11:11", gateUpdate)).rejects.toThrow(ConflictError);

        expect(mockFind).toHaveBeenCalledWith({
            where: { gatewayMac: "22:22:22:22:22:22" }
        });

    });

    it("update gateway - no gateway found to update, NotFoundError thrown", async () => {
        //mockFind should not return a gateway, meaning the new gateway mac is ok
        mockFind.mockResolvedValue([]);


        //mockUpdate should return affected rows = 0, meaning the gateway was not found
        const mockUpdateResult: UpdateResult =  {
            raw: [], //not important for this test
            affected: 0,
            generatedMaps: [] //not important for this test
        }

        mockUpdate.mockResolvedValue(mockUpdateResult);

        //attempt to update the gateway
        const gateUpdate: Partial<GatewayDAO> = {
            gatewayMac: "22:22:22:22:22:22",
            gatewayName: "New Name",
            gatewayDescription: "New Description"
        };

        await expect(repo.updateGateway("networkCode1", "11:11:11:11:11:11", gateUpdate)).rejects.toThrow(NotFoundError);
        

        //check that mockUpdate has been called with the correct parameters
        expect(mockUpdate).toHaveBeenCalledWith(
            {
                gatewayMac: "11:11:11:11:11:11",
                network: { networkCode : "networkCode1" }
            },
            gateUpdate
        );
    });

    it("delete gateway", async () => {
        //simulate the delete method returns 1 affected rows, meaning the gateway was found and deleted
        const mockDeleteResult: DeleteResult = {
            raw: [], //not important for this test
            affected: 1
        };

        mockDelete.mockResolvedValue(mockDeleteResult);

        await expect(repo.deleteGateway("networkCode1", "11:11:11:11:11:11")).resolves.not.toThrow();


        //Check that the mockDelete has been called with the correct parameters
        expect(mockDelete).toHaveBeenCalledWith({
            gatewayMac: "11:11:11:11:11:11",
            network: { networkCode: "networkCode1" }
        });

    });

    it("delete network: not found", async () => {
        //simulate the delete method returns 0 affected rows, meaning the gateway was not found
        const mockDeleteResult: DeleteResult = {
            raw: [], //not important for this test
            affected: 0
        };

        mockDelete.mockResolvedValue(mockDeleteResult);

        await expect(repo.deleteGateway("networkCode1", "11:11:11:11:11:11")).rejects.toThrow(NotFoundError);

        //Check that the mockDelete has been called with the correct parameters
        expect(mockDelete).toHaveBeenCalledWith({
            gatewayMac: "11:11:11:11:11:11",
            network: { networkCode: "networkCode1" }
        });

    });

});