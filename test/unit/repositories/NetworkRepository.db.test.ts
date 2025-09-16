import { NetworkRepository, GatewayRepository } from "@repositories/index";
import {
    initializeTestDataSource,
    closeTestDataSource,
    TestDataSource
  } from "@test/setup/test-datasource";
import { NetworkDAO, GatewayDAO } from "@dao/index";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import { load } from "yamljs";


beforeAll(async () => {
    await initializeTestDataSource();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("NetworkRepository: SQLite in-memory", () => {

    const repo = new NetworkRepository();

    it("create network", async () => {
        //attempt to create a new network
        const network = await repo.createNetwork("networkCode1", "Network Name", "Description 1");
        expect(network).toBeDefined();
        expect(network).toMatchObject({
            networkCode: "networkCode1",
            networkName: "Network Name",
            networkDescription: "Description 1"
        });

        //retrieve the newly created network from the database
        const found = await repo.getNetworkByNetworkCode("networkCode1");
        expect(found).toBeDefined();
        expect(found.networkCode).toBe("networkCode1");
        expect(found.networkName).toBe("Network Name");
        expect(found.networkDescription).toBe("Description 1");
    });


    it("create network with existing networkCode - ConflictError thrown", async () => {
        //create a network with the same networkCode
        const network = await repo.createNetwork("networkCode1", "Network Name", "Description 1");
        expect(network).toBeDefined();
        expect(network).toMatchObject({
            networkCode: "networkCode1",
            networkName: "Network Name",
            networkDescription: "Description 1"
        });

        //attempt to create a new network with the same networkCode
        await expect(repo.createNetwork("networkCode1", "Network Name", "Description 1")).rejects.toThrow(ConflictError);


    });

    it("create a network - test nullable fields", async () => {
        //create a network with null name and description
        const network = await repo.createNetwork("networkCode1", undefined, undefined);
        expect(network).toBeDefined();
        expect(network.networkCode).toBe("networkCode1");
        expect(network.networkName).toBe(null);
        expect(network.networkDescription).toBe(null);

        //retrieve the newly created network from the database
        const found = await repo.getNetworkByNetworkCode("networkCode1");
        expect(found).toBeDefined();
        expect(found.networkCode).toBe("networkCode1");
        expect(found.networkName).toBe(null);
        expect(found.networkDescription).toBe(null);

    });

    it("get network by networkCode", async () => {
        //create a network to retrieve
        const network = await repo.createNetwork("networkCode1", "Network Name", "Description 1");
        expect(network).toBeDefined();
        expect(network).toMatchObject({
            networkCode: "networkCode1",
            networkName: "Network Name",
            networkDescription: "Description 1"
        });

        //retrieve the created network from the database
        const found = await repo.getNetworkByNetworkCode("networkCode1");
        expect(found).toBeDefined();
        expect(found.networkCode).toBe("networkCode1");
        expect(found.networkName).toBe("Network Name");
        expect(found.networkDescription).toBe("Description 1");
    });


    it("get network by networkCode: not found", async () => {
        //attempt to retrieve a network that does not exist
        await expect(repo.getNetworkByNetworkCode("ghost")).rejects.toThrow(NotFoundError);
    });

    it("get all networks", async () => {
        //create a few networks
        const net1 = await repo.createNetwork("networkCode1", "Network Name", "Description 1");
        expect(net1).toBeDefined();
        expect(net1).toMatchObject({
            networkCode: "networkCode1",
            networkName: "Network Name",
            networkDescription: "Description 1"
        });
        const net2 = await repo.createNetwork("networkCode2", "Network Name", "Description 2");
        expect(net2).toBeDefined();
        expect(net2).toMatchObject({
            networkCode: "networkCode2",
            networkName: "Network Name",
            networkDescription: "Description 2"
        });

        //retrieve all networks from the database
        const networks = await repo.getAllNetworks();
        expect(networks).toBeDefined();
        expect(networks.length).toBe(2);
        //check if the retrieved network correctly match the created networks
        expect(networks[0].networkCode).toBe("networkCode1");
        expect(networks[0].networkName).toBe("Network Name");
        expect(networks[0].networkDescription).toBe("Description 1");
        expect(networks[1].networkCode).toBe("networkCode2");
        expect(networks[1].networkName).toBe("Network Name");
        expect(networks[1].networkDescription).toBe("Description 2");
    });

    it("get all networks: empty list", async () => {
        //retrieve all networks from the database when there are no networks
        const networks = await repo.getAllNetworks();
        expect(networks).toBeDefined();
        expect(networks.length).toBe(0);
    });

    it("update network", async () => {

        //first create a network to update
        const network = await repo.createNetwork("networkCode1", "Network Name", "Description 1");
        expect(network).toBeDefined();
        expect(network).toMatchObject({
            networkCode: "networkCode1",
            networkName: "Network Name",
            networkDescription: "Description 1"
        });


        //1. update the network with a Partial<NetworkDAO> object
        //ALL FIELDS are updated: newNetworkCode, newNetworkName, newNetworkDescription
        const networkUpdate0: Partial<NetworkDAO> = {
            networkCode: "newNetworkCode",
            networkName: "New Network Name",
            networkDescription: "New Description"
        };

        await repo.updateNetwork("networkCode1", networkUpdate0);

        //now get the updated network from the database
        let foundUpdatedNetwork = await repo.getNetworkByNetworkCode("newNetworkCode");
        expect(foundUpdatedNetwork).toBeDefined();
        expect(foundUpdatedNetwork.networkCode).toBe("newNetworkCode");
        expect(foundUpdatedNetwork.networkName).toBe("New Network Name");
        expect(foundUpdatedNetwork.networkDescription).toBe("New Description");

        //now when searching for the old networkCode, it should throw a NotFoundError
        await expect(repo.getNetworkByNetworkCode("networkCode1")).rejects.toThrow(NotFoundError);

        //2. update the network with a Partial<NetworkDAO> object
        //only the networkCode is updated: newNetworkCode
        const networkUpdate1: Partial<NetworkDAO> = {
            networkCode: "newNetworkCode2"
        };

        await repo.updateNetwork("newNetworkCode", networkUpdate1);

        //now get the updated network from the database
        foundUpdatedNetwork = await repo.getNetworkByNetworkCode("newNetworkCode2");
        expect(foundUpdatedNetwork).toBeDefined();
        expect(foundUpdatedNetwork.networkCode).toBe("newNetworkCode2");
        //these fields should not be updated and should remain the same as before
        expect(foundUpdatedNetwork.networkName).toBe("New Network Name");
        expect(foundUpdatedNetwork.networkDescription).toBe("New Description");

        //now when searching for the old networkCode, it should throw a NotFoundError
        await expect(repo.getNetworkByNetworkCode("newNetworkCode")).rejects.toThrow(NotFoundError);


        //3. update the network with a Partial<NetworkDAO> object
        //only the networkName is updated: newNetworkName

        const networkUpdate2: Partial<NetworkDAO> = {
            networkName: "New Network Name 2"
        };

        await repo.updateNetwork("newNetworkCode2", networkUpdate2);

        //now get the updated network from the database
        foundUpdatedNetwork = await repo.getNetworkByNetworkCode("newNetworkCode2");
        expect(foundUpdatedNetwork).toBeDefined();
        expect(foundUpdatedNetwork.networkCode).toBe("newNetworkCode2");    //this field should remain the same as before
        expect(foundUpdatedNetwork.networkName).toBe("New Network Name 2"); //this field should be updated
        expect(foundUpdatedNetwork.networkDescription).toBe("New Description"); //this field should remain the same as before



        //4. update the network with a Partial<NetworkDAO> object
        //only the networkDescription is updated: newNetworkDescription

        const networkUpdate3: Partial<NetworkDAO> = {
            networkDescription: "New Description 2"
        };

        await repo.updateNetwork("newNetworkCode2", networkUpdate3);

        //now get the updated network from the database
        foundUpdatedNetwork = await repo.getNetworkByNetworkCode("newNetworkCode2");
        expect(foundUpdatedNetwork).toBeDefined();
        expect(foundUpdatedNetwork.networkCode).toBe("newNetworkCode2");    //this field should remain the same as before
        expect(foundUpdatedNetwork.networkName).toBe("New Network Name 2"); //this field should remain the same as before
        expect(foundUpdatedNetwork.networkDescription).toBe("New Description 2"); //this field should be updated
    });

    it("update network: not found", async () => {
        //attempt to update a network that does not exist
        const networkUpdate: Partial<NetworkDAO> = {
            networkCode: "newNetworkCode",
            networkName: "New Network Name",
            networkDescription: "New Description"
        };
        await expect(repo.updateNetwork("ghost", networkUpdate)).rejects.toThrow(NotFoundError);
    });

    it("update network: conflict", async () => {
        //attempt to update a network with a networkCode that already exists
        const network1 = await repo.createNetwork("networkCode1", "Network Name", "Description 1");
        expect(network1).toBeDefined();
        expect(network1).toMatchObject({
            networkCode: "networkCode1",
            networkName: "Network Name",
            networkDescription: "Description 1"
        });

        const network2 = await repo.createNetwork("networkCode2", "Network Name", "Description 2");
        expect(network2).toBeDefined();
        expect(network2).toMatchObject({
            networkCode: "networkCode2",
            networkName: "Network Name",
            networkDescription: "Description 2"
        });

        //attempt to update the first network with the networkCode of the second network
        const networkUpdate: Partial<NetworkDAO> = {
            networkCode: "networkCode2"
        };

        await expect(repo.updateNetwork("networkCode1", networkUpdate)).rejects.toThrow(ConflictError);
    });

    it("update network: update gateways networkCode on cascade", async () => {
        //just for this test, we need to use the GatewayRepo
        await TestDataSource.getRepository(GatewayDAO).clear();
        const gatewayRepo = new GatewayRepository();

        //create a network to update
        const network = await repo.createNetwork("networkCode1", "Network Name", "Description 1");
        expect(network).toBeDefined();
        expect(network).toMatchObject({
            networkCode: "networkCode1",
            networkName: "Network Name",
            networkDescription: "Description 1"
        });

        //associate a gateway to the network
        const gateway = await gatewayRepo.createGateway("networkCode1", "gatewayMac1", "Gateway Name", "Description 1");
        expect(gateway).toBeDefined();
        expect(gateway).toMatchObject({
            gatewayMac: "gatewayMac1",
            gatewayName: "Gateway Name",
            gatewayDescription: "Description 1"
        });

        //update the network with a new networkCode
        const networkUpdate: Partial<NetworkDAO> = {
            networkCode: "newNetworkCode"
        };

        await repo.updateNetwork("networkCode1", networkUpdate);

        //now get the updated network from the database
        const foundUpdatedNetwork = await repo.getNetworkByNetworkCode("newNetworkCode");
        expect(foundUpdatedNetwork).toBeDefined();
        expect(foundUpdatedNetwork.networkCode).toBe("newNetworkCode");


        //now get the updated gateway from the database
        //we have to check their networkCode is now listed as "newNetworkCode" and not "networkCode1"
        const foundUpdatedGateway = await gatewayRepo.getGatewayByNetworkCodeGatewayMac("newNetworkCode", "gatewayMac1", true);
        expect(foundUpdatedGateway).toBeDefined();
        expect(foundUpdatedGateway.gatewayMac).toBe("gatewayMac1");
        console.log("GW NET: ", foundUpdatedGateway);
        expect(foundUpdatedGateway.network.networkCode).toBe("newNetworkCode"); //this field should be updated

        //attempt to get gateways using the old networkCode
        //this should throw a NotFoundError since the networkCode has been updated
        await expect(gatewayRepo.getGatewayByNetworkCodeGatewayMac("networkCode1", "gatewayMac1", true)).rejects.toThrow(NotFoundError);

        //just to be sure, load all the gateways from the database and check that the list has just one element
        //loadNetwork = true to check the new networkCode
        const gateways = await gatewayRepo.getAllGateways(true);
        expect(gateways).toBeDefined();
        expect(gateways.length).toBe(1);
        //check the networkCode of the gateway is now "newNetworkCode"
        expect(gateways[0]).toBeDefined();
        expect(gateways[0].gatewayMac).toBe("gatewayMac1");
        expect(gateways[0].network.networkCode).toBe("newNetworkCode");

    });

    it("delete network", async () => {
        //create a network to delete
        const network = await repo.createNetwork("networkCode1", "Network Name", "Description 1");
        expect(network).toBeDefined();
        expect(network).toMatchObject({
            networkCode: "networkCode1",
            networkName: "Network Name",
            networkDescription: "Description 1"
        });

        //delete the network from the database
        await repo.deleteNetwork("networkCode1");

        //attempt to retrieve the deleted network from the database
        await expect(repo.getNetworkByNetworkCode("networkCode1")).rejects.toThrow(NotFoundError);
    });

    it("delete network: not found", async () => {
        //attempt to delete a network that does not exist
        await expect(repo.deleteNetwork("ghost")).rejects.toThrow(NotFoundError);
    });

    it("delete network: delete gateways on cascade", async () => {

        //just for this test, we need to use the GatewayRepo
        await TestDataSource.getRepository(GatewayDAO).clear();
        const gatewayRepo = new GatewayRepository();

        //create a network to delete
        const network = await repo.createNetwork("networkCode1", "Network Name", "Description 1");
        expect(network).toBeDefined();
        expect(network).toMatchObject({
            networkCode: "networkCode1",
            networkName: "Network Name",
            networkDescription: "Description 1"
        });


        //associate a gateway to the network
        const gateway = await gatewayRepo.createGateway("networkCode1", "gatewayMac1", "Gateway Name", "Description 1");
        expect(gateway).toBeDefined();
        expect(gateway).toMatchObject({
            gatewayMac: "gatewayMac1",
            gatewayName: "Gateway Name",
            gatewayDescription: "Description 1"
        });

        //delete the network from the database
        await repo.deleteNetwork("networkCode1");


        //now, since we enforced the delete on cascade, the gateway should be deleted as well
        //attempt to retrieve the deleted gateway from the database
        await expect(gatewayRepo.getGatewayByNetworkCodeGatewayMac("networkCode1", "gatewayMac1", true)).rejects.toThrow(NotFoundError);

        //just to be sure, load all the gateways from the database and check that the list is empty
        const gateways = await gatewayRepo.getAllGateways();
        expect(gateways).toBeDefined();
        expect(gateways.length).toBe(0);

    });



});