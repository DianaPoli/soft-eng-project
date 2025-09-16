import { NetworkRepository } from "@repositories/NetworkRepository";
import { NetworkDAO } from "@dao/NetworkDAO";
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



describe("NetworkRepository: mocked database", () => {

    const repo = new NetworkRepository();

    beforeEach(() => {
        jest.clearAllMocks();
    });


    it("create network", async () => {
        //Mock the find method to return an empty array, no conflict with network to be created
        mockFind.mockResolvedValue([]);

        const savedNet = new NetworkDAO();
        //"networkCode1", "Network Name", "Description 1"
        savedNet.networkCode = "networkCode1";
        savedNet.networkName = "Network Name";
        savedNet.networkDescription = "Description 1";

        //Mock the save method to return the saved network
        mockSave.mockResolvedValue(savedNet);

        const savedNetReal = await repo.createNetwork("networkCode1", "Network Name", "Description 1");

        //Now check that the saved network is the same as the one we created
        expect(savedNetReal).toBeDefined();
        expect(savedNetReal).toBeInstanceOf(NetworkDAO);
        //check params
        expect(savedNetReal.networkCode).toBe("networkCode1");
        expect(savedNetReal.networkName).toBe("Network Name");
        expect(savedNetReal.networkDescription).toBe("Description 1");


        //Check that the mockSave has been called with the correct parameters
        expect(mockSave).toHaveBeenCalledWith({
            networkCode: "networkCode1",
            networkName: "Network Name",
            networkDescription: "Description 1"
        });

    });


    it("create network with existing networkCode - ConflictError thrown", async () => {

        //Now simulate a net with the same networkCode already in the database
        const alreadyPresentNet = new NetworkDAO();
        alreadyPresentNet.networkCode = "networkCode1";
        alreadyPresentNet.networkName = "Network Name";
        alreadyPresentNet.networkDescription = "Description 1";

        mockFind.mockResolvedValue([alreadyPresentNet]);

        //Now try to create a new network inserting the same networkCode
        //A ConflictError should be thrown

        await expect(repo.createNetwork("networkCode1", "Network Name", "Description 1")).rejects.toThrow(ConflictError);
    });

    it("get network by networkCode", async () => {
        const foundNet = new NetworkDAO();
        foundNet.networkCode = "networkCode1";
        foundNet.networkName = "Network Name";
        foundNet.networkDescription = "Description 1";

        mockFindOne.mockResolvedValue(foundNet);

        //find the network by networkCode

        const foundNetReal = await repo.getNetworkByNetworkCode("networkCode1");
        expect(foundNetReal).toBeDefined();
        expect(foundNetReal.networkCode).toBe("networkCode1");
        expect(foundNetReal.networkName).toBe("Network Name");
        expect(foundNetReal.networkDescription).toBe("Description 1");


        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                networkCode: "networkCode1"
            },
            relations: ["gateways", "gateways.sensors"] //always eagerly load the gateways and sensors relation
        });


    });


    it("get network by networkCode: not found", async () => {
        //simulate netowkr not found in the db providing an unextisting networkCode
        //it's expected to throw a NotFoundError
        mockFindOne.mockResolvedValue(null);
        await expect(repo.getNetworkByNetworkCode("ghost")).rejects.toThrow(NotFoundError);

        //Check that the mockFind has been called with the correct parameters
        expect(mockFindOne).toHaveBeenCalledWith({
            where: {
                networkCode: "ghost"
            },
            relations: ["gateways", "gateways.sensors"] //always eagerly load the gateways and sensors relation
        });

    });


    it("get all networks", async () => {
        const existingNet1 = new NetworkDAO();
        existingNet1.networkCode = "networkCode1";
        existingNet1.networkName = "Network Name";
        existingNet1.networkDescription = "Description 1";

        const existingNet2 = new NetworkDAO();
        existingNet2.networkCode = "networkCode2";
        existingNet2.networkName = "Network Name 2";
        existingNet2.networkDescription = "Description 2";

        const findRes = [existingNet1, existingNet2];

        mockFind.mockResolvedValue(findRes);


        const allNetsReal = await repo.getAllNetworks();
        //check they correspond to the ones we created before
        expect(allNetsReal).toBeDefined();
        expect(allNetsReal.length).toBe(2);
        expect(allNetsReal[0].networkCode).toBe("networkCode1");
        expect(allNetsReal[0].networkName).toBe("Network Name");
        expect(allNetsReal[0].networkDescription).toBe("Description 1");

        expect(allNetsReal[1].networkCode).toBe("networkCode2");
        expect(allNetsReal[1].networkName).toBe("Network Name 2");
        expect(allNetsReal[1].networkDescription).toBe("Description 2");


    });


    it("get all networks: empty list", async () => {
        //suppose there are no networks in the db
        //the find method should return an empty array
        mockFind.mockResolvedValue([]);


        const allNetsReal = await repo.getAllNetworks();
        //check they correspond to the ones we created before
        expect(allNetsReal).toBeDefined();
        expect(allNetsReal.length).toBe(0);
        expect(allNetsReal).toEqual([]);

    });


    it("update network", async () => {

        //mockFind should not return a network, meaning the new networkCode is ok
        mockFind.mockResolvedValue([]);


        //mockUpdate should return affected rows = 1, meaning the network was found and updated
        const mockUpdateResult: UpdateResult =  {
            raw: [], //not important for this test
            affected: 1,
            generatedMaps: [] //not important for this test
        }

        mockUpdate.mockResolvedValue(mockUpdateResult);

        //attempt to update the network
        const netUpdate: Partial<NetworkDAO> = {
            networkCode: "New Name",
            networkDescription: "New Description"
        };

        //expect no errors to be thrown
        await expect(repo.updateNetwork("networkCode1", netUpdate)).resolves.not.toThrow();


        //check that mockUpdate has been called with the correct parameters
        expect(mockUpdate).toHaveBeenCalledWith(
            { networkCode: "networkCode1" },
            {
                networkCode: "New Name",
                networkDescription: "New Description"
            }
        );

        //Check that the mockFind has been called with the correct parameters
        expect(mockFind).toHaveBeenCalledWith({
            where: {
                networkCode: "New Name"
            }
        });

        

    });


    it("update network: not found", async () => {
        
        //simulate find throws anything to new network Code is ok
        mockFind.mockResolvedValue([]);

        //simulate the update method returns 0 affected rows, meaning the network was not found
        const mockUpdateResult: UpdateResult =  {
            raw: [],
            affected: 0,
            generatedMaps: []
        }


        //so the repository function should throw a NotFoundError
        const updateArgs: Partial<NetworkDAO> = {
            networkCode: "New Name",
            networkDescription: "New Description"
        };

        const oldNetworkCode = "networkCode1";

        //mock te behavior of update method to return 0 affected rows
        mockUpdate.mockResolvedValue(mockUpdateResult);

        await expect(repo.updateNetwork(oldNetworkCode, updateArgs)).rejects.toThrow(NotFoundError);

    });

    it("update network: conflict error", async () => {
        //simulate find returns an existing network
        //this means the new networkCode is already in use
        //so a ConflictError should be thrown
        const existingNet = new NetworkDAO(); //params are not important for this test
        mockFind.mockResolvedValue([existingNet]);

        await expect(repo.updateNetwork("networkCode1", { networkCode: "networkCode1New" })).rejects.toThrow(ConflictError);

    });

    it("delete network", async () => {
        //simulate the delete method returns 1 affected rows, meaning the network was found and deleted
        const mockDeleteResult: DeleteResult = {
            raw: [], //not important for this test
            affected: 1
        };

        mockDelete.mockResolvedValue(mockDeleteResult);

        await expect(repo.deleteNetwork("networkCode1")).resolves.not.toThrow();


        //Check that the mockDelete has been called with the correct parameters
        expect(mockDelete).toHaveBeenCalledWith({
            networkCode: "networkCode1"
        });


    });

    it("delete network: not found", async () => {
        //simulate the delete method returns 0 affected rows, meaning the network was not found
        const mockDeleteResult: DeleteResult = {
            raw: [], //not important for this test
            affected: 0
        };

        mockDelete.mockResolvedValue(mockDeleteResult);

        await expect(repo.deleteNetwork("networkCode1")).rejects.toThrow(NotFoundError);


    });

});