/**
 * networkController.integration.test.ts
 * Creation date: 2025-05-16
 * Last revision date: 2025-05-16
 * SWE Group 54
 */

import * as networkController from "@controllers/networkController";
import { NetworkDAO } from "@dao/NetworkDAO";
import { Network as NetworkDTO, Gateway as GatewayDTO } from "@dto/index";
import { GatewayDAO } from "@models/dao";
import { NetworkRepository } from "@repositories/NetworkRepository";

//mock the NetworkRepository
jest.mock("@repositories/NetworkRepository");


describe("NetworkController integration", () => {

    it("getAllNetworks - no gateways - mapperService integration", async () => {
        //mock the NetworkDAO
        const fakeNetworkDAO0: NetworkDAO = {
            networkCode: "testNetwork",
            networkName: "Test Network",
            networkDescription: "This is a test network",
            gateways: [] //for this first test, don't add gateways  
        };

        const fakeNetworkDAO1: NetworkDAO = {
            networkCode: "testNetwork2",
            networkName: "Test Network 2",
            networkDescription: "This is a test network 2",
            gateways: [] //for this first test, don't add gateways  
        };

        const fakeNetworkDAO2: NetworkDAO = {
            networkCode: "testNetwork3",
            networkName: "Test Network 3",
            networkDescription: "This is a test network 3",
            gateways: [] //for this first test, don't add gateways  
        };

        const expectedNetworkDTO0: NetworkDTO = {
            code: fakeNetworkDAO0.networkCode,
            name: fakeNetworkDAO0.networkName,
            description: fakeNetworkDAO0.networkDescription,
            //gateways: [] 
            //YOU HAVE TO REFLECT IF ADD AGTEWAYS EVEN IF THEY ARE EMPTY,
            //OPENAPI PUTS EVERY FIELD AS OPTIONAL IN THE NETWORK DTO
            //SO BOTH OPTIONS ARE VALID
            //HOWEVER, YOU HAVE TO DECIDE AND MAKE A TRADEOFF BETWEEN:
            //1. PUTTING GATEWAYS AS OPTIONAL IN THE DTO -> SMALLER PAYLOAD SENT
            //2. PUTTING GATEWAYS AS REQUIRED IN THE DTO -> BIGGER PAYLOAD SENT, BUT MORE CONSISTENT
        };

        const expectedNetworkDTO1: NetworkDTO = {
            code: fakeNetworkDAO1.networkCode,
            name: fakeNetworkDAO1.networkName,
            description: fakeNetworkDAO1.networkDescription,
        };

        const expectedNetworkDTO2: NetworkDTO = {
            code: fakeNetworkDAO2.networkCode,
            name: fakeNetworkDAO2.networkName,
            description: fakeNetworkDAO2.networkDescription,
        };


        //mock te resolved value of the getAllNetworks method
        //it will return the three network DAOs
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            getAllNetworks: jest.fn().mockResolvedValue([fakeNetworkDAO0, fakeNetworkDAO1, fakeNetworkDAO2])
        }));

        //now, it's the mapper service duty to map the DAOs to DTOs
        //this is called by the controller function
        const result = await networkController.getAllNetworks();
        console.log(result);
        expect(result).toBeDefined();
        expect(result).toHaveLength(3);
        expect(result[0]).toEqual(expectedNetworkDTO0);
        expect(result[1]).toEqual(expectedNetworkDTO1);
        expect(result[2]).toEqual(expectedNetworkDTO2);
    
    });

    it("getAllNetworks - with gateways - mapperService integration", async () => {
        //mock the NetworkDAO
        const fakeNetworkDAO0: NetworkDAO = {
            networkCode: "testNetwork",
            networkName: "Test Network",
            networkDescription: "This is a test network",
            gateways: [] //for this first test, don't add gateways
        };
        const fakeGatewayDAO0: GatewayDAO = {
            gatewayMac: "00:00:00:00:00:01",
            gatewayName: "Test Gateway 1",
            gatewayDescription: "This is a test gateway 1",
            network: fakeNetworkDAO0,
            sensors: [] //for this first test, don't add sensors
        };

        fakeNetworkDAO0.gateways.push(fakeGatewayDAO0);


        const fakeNetworkDAO1: NetworkDAO = {
            networkCode: "testNetwork2",
            networkName: "Test Network 2",
            networkDescription: "This is a test network 2",
            gateways: [] //for this first test, don't add gateways  
        };
        const fakeGatewayDAO1: GatewayDAO = {
            gatewayMac: "00:00:00:00:00:02",
            gatewayName: "Test Gateway 2",
            gatewayDescription: "This is a test gateway 2",
            network: fakeNetworkDAO1,
            sensors: [] //for this first test, don't add sensors
        };
        fakeNetworkDAO1.gateways.push(fakeGatewayDAO1);

        const fakeNetworkDAO2: NetworkDAO = {
            networkCode: "testNetwork3",
            networkName: "Test Network 3",
            networkDescription: "This is a test network 3",
            gateways: [] //for this first test, don't add gateways  
        };
        const fakeGatewayDAO2: GatewayDAO = {
            gatewayMac: "00:00:00:00:00:03",
            gatewayName: "Test Gateway 3",
            gatewayDescription: "This is a test gateway 3",
            network: fakeNetworkDAO2,
            sensors: [] //for this first test, don't add sensors
        };
        fakeNetworkDAO2.gateways.push(fakeGatewayDAO2);

        const expectedNetworkDTO0: NetworkDTO = {
            code: fakeNetworkDAO0.networkCode,
            name: fakeNetworkDAO0.networkName,
            description: fakeNetworkDAO0.networkDescription,
            gateways: [
                {
                    macAddress: fakeGatewayDAO0.gatewayMac,
                    name: fakeGatewayDAO0.gatewayName,
                    description: fakeGatewayDAO0.gatewayDescription
                }
            ]
        };

        const expectedNetworkDTO1: NetworkDTO = {
            code: fakeNetworkDAO1.networkCode,
            name: fakeNetworkDAO1.networkName,
            description: fakeNetworkDAO1.networkDescription,
            gateways: [
                {
                    macAddress: fakeGatewayDAO1.gatewayMac,
                    name: fakeGatewayDAO1.gatewayName,
                    description: fakeGatewayDAO1.gatewayDescription
                }
            ]
        };

        const expectedNetworkDTO2: NetworkDTO = {
            code: fakeNetworkDAO2.networkCode,
            name: fakeNetworkDAO2.networkName,
            description: fakeNetworkDAO2.networkDescription,
            gateways: [
                {
                    macAddress: fakeGatewayDAO2.gatewayMac,
                    name: fakeGatewayDAO2.gatewayName,
                    description: fakeGatewayDAO2.gatewayDescription
                }
            ]
        };

        //mock te resolved value of the getAllNetworks method
        //it will return the three network DAOs
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            getAllNetworks: jest.fn().mockResolvedValue([fakeNetworkDAO0, fakeNetworkDAO1, fakeNetworkDAO2])
        }));

        //now, it's the mapper service duty to map the DAOs to DTOs
        //this is called by the controller function
        const result = await networkController.getAllNetworks();
        console.log(result);
        expect(result).toBeDefined();
        expect(result).toHaveLength(3);
        expect(result[0]).toEqual(expectedNetworkDTO0);
        expect(result[1]).toEqual(expectedNetworkDTO1);
        expect(result[2]).toEqual(expectedNetworkDTO2);
        //check nested gateways
        expect(result[0].gateways).toBeDefined();
        expect(result[0].gateways).toHaveLength(1);
        expect(result[0].gateways[0]).toEqual(expectedNetworkDTO0.gateways[0]);
        expect(result[0].gateways[0].macAddress).toEqual(fakeGatewayDAO0.gatewayMac);
        expect(result[0].gateways[0].name).toEqual(fakeGatewayDAO0.gatewayName);
        expect(result[0].gateways[0].description).toEqual(fakeGatewayDAO0.gatewayDescription);
        expect(result[1].gateways).toBeDefined();
        expect(result[1].gateways).toHaveLength(1);
        expect(result[1].gateways[0]).toEqual(expectedNetworkDTO1.gateways[0]);
        expect(result[1].gateways[0].macAddress).toEqual(fakeGatewayDAO1.gatewayMac);
        expect(result[1].gateways[0].name).toEqual(fakeGatewayDAO1.gatewayName);
        expect(result[1].gateways[0].description).toEqual(fakeGatewayDAO1.gatewayDescription);
        expect(result[2].gateways).toBeDefined();
        expect(result[2].gateways).toHaveLength(1);
        expect(result[2].gateways[0]).toEqual(expectedNetworkDTO2.gateways[0]);
        expect(result[2].gateways[0].macAddress).toEqual(fakeGatewayDAO2.gatewayMac);
        expect(result[2].gateways[0].name).toEqual(fakeGatewayDAO2.gatewayName);
        expect(result[2].gateways[0].description).toEqual(fakeGatewayDAO2.gatewayDescription);

    });

    it("getNetworkByNetworkCode - no gateways - mapperService integration", async () => {
        //mock the NetworkDAO
        const fakeNetworkDAO: NetworkDAO = {
            networkCode: "testNetwork",
            networkName: "Test Network",
            networkDescription: "This is a test network",
            gateways: [] //for this first test, don't add gateways  
        };

        const expectedNetworkDTO: NetworkDTO = {
            code: fakeNetworkDAO.networkCode,
            name: fakeNetworkDAO.networkName,
            description: fakeNetworkDAO.networkDescription,
        };

        //mock te resolved value of the getAllNetworks method
        //it will return the three network DAOs
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            getNetworkByNetworkCode: jest.fn().mockResolvedValue(fakeNetworkDAO)
        }));

        //now, it's the mapper service duty to map the DAOs to DTOs
        //this is called by the controller function
        const result = await networkController.getNetworkByNetworkCode(fakeNetworkDAO.networkCode);
        console.log(result);
        expect(result).toBeDefined();
        expect(result).toEqual(expectedNetworkDTO);
    });

    it("getNetworkByNetworkCode - with gateways - mapperService integration", async () => {
        //mock the NetworkDAO
        const fakeNetworkDAO: NetworkDAO = {
            networkCode: "testNetwork",
            networkName: "Test Network",
            networkDescription: "This is a test network",
            gateways: []   
        };
        const fakeGatewayDAO: GatewayDAO = {
            gatewayMac: "00:00:00:00:00:01",
            gatewayName: "Test Gateway 1",
            gatewayDescription: "This is a test gateway 1",
            network: fakeNetworkDAO,
            sensors: [] //for this first test, don't add sensors
        };

        fakeNetworkDAO.gateways.push(fakeGatewayDAO);

        const expectedNetworkDTO: NetworkDTO = {
            code: fakeNetworkDAO.networkCode,
            name: fakeNetworkDAO.networkName,
            description: fakeNetworkDAO.networkDescription,
            gateways: [
                {
                    macAddress: fakeGatewayDAO.gatewayMac,
                    name: fakeGatewayDAO.gatewayName,
                    description: fakeGatewayDAO.gatewayDescription
                }
            ]
        };

        //mock te resolved value of the getAllNetworks method
        //it will return the network DAO
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            getNetworkByNetworkCode: jest.fn().mockResolvedValue(fakeNetworkDAO)
        }));

        //now, it's the mapper service duty to map the DAOs to DTOs
        //this is called by the controller function
        const result = await networkController.getNetworkByNetworkCode(fakeNetworkDAO.networkCode);
        expect(result).toBeDefined();
        expect(result).toEqual(expectedNetworkDTO);
        //check nested gateways
        expect(result.gateways).toBeDefined();
        expect(result.gateways).toHaveLength(1);
        expect(result.gateways[0]).toEqual(expectedNetworkDTO.gateways[0]);
        expect(result.gateways[0].macAddress).toEqual(fakeGatewayDAO.gatewayMac);
        expect(result.gateways[0].name).toEqual(fakeGatewayDAO.gatewayName);
        expect(result.gateways[0].description).toEqual(fakeGatewayDAO.gatewayDescription);

    });

    it("getNetworkByNetworkCode - test nullable fields - mapperService integration", async () => {
        //test nullable fields: name, description
        //repo will assign them to null
        //mock the NetworkDAO
        const fakeNetworkDAO: NetworkDAO = {
            networkCode: "testNetwork",
            networkName: null, //NULL in DB
            networkDescription: null, //NULL in DB
            gateways: [] 
        };

        const expectedNetworkDTO: NetworkDTO = {
            code: fakeNetworkDAO.networkCode,
        };

        //mock te resolved value of the getAllNetworks method
        //it will return the network DAO
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            getNetworkByNetworkCode: jest.fn().mockResolvedValue(fakeNetworkDAO)
        }));

        //now, it's the mapper service duty to map the DAOs to DTOs
        //this is called by the controller function
        const result = await networkController.getNetworkByNetworkCode(fakeNetworkDAO.networkCode);

        expect(result).toBeDefined();
        expect(result).toEqual(expectedNetworkDTO);
        expect(result).not.toHaveProperty("name");
        expect(result).not.toHaveProperty("description");

    });

        
    it("updateNetwork - no nested gateways - mapperService integration", async () => {
        //mock the NetworkDAO
        const fakeNetworkDAO: NetworkDAO = {
            networkCode: "testNetwork",
            networkName: "Test Network",
            networkDescription: "This is a test network",
            gateways: [] //for this first test, don't add gateways  
        };

        const fakeNetworkUpdate: NetworkDTO = {
            code: "testNetworkUpdated",
            name: "Test Network Updated",
            description: "This is a test network updated"
        };


        //mock getNetworkByNetworkCode to return the fakeNetworkDAO
        //mock updateNetwork to return Promise<void>
        //I declare mockUpdateNetworkMethod outside the scope sicne I'll check wether it has been caled correctly after
        const mockUpdateNetworkMethod = jest.fn().mockResolvedValue(Promise.resolve());
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            getNetworkByNetworkCode: jest.fn().mockResolvedValue(fakeNetworkDAO),
            updateNetwork: mockUpdateNetworkMethod
        }));

        //this is what the mapper function will return:
        const updateAfterMapper: Partial<NetworkDAO> = {
            networkCode: fakeNetworkUpdate.code,
            networkName: fakeNetworkUpdate.name,
            networkDescription: fakeNetworkUpdate.description
        };

        await networkController.updateNetwork(fakeNetworkDAO.networkCode, fakeNetworkUpdate);
        //check mapNetworkDTOToPartialDAO called correctly

        //check updateNetwork called correctly
        //check the mapper function mapNetworkDTOToPartialDAO has returned the correct value, so updateAfterMapper
        //since in the real implementation inside the controller we have:
        //await networkRepo.updateNetwork(oldnetworkCode, mapNetworkDTOToPartialDAO(filteredNetwork));
        expect(mockUpdateNetworkMethod).toHaveBeenCalledWith(fakeNetworkDAO.networkCode, updateAfterMapper);

        //TODO: UPDATE JUST SOME FIELDS AND CHECK THE MAPPER FUNCTION
        const fakeNetworkDAOAfterUpdate1: NetworkDAO = {
            networkCode: fakeNetworkUpdate.code,
            networkName: fakeNetworkUpdate.name,
            networkDescription: fakeNetworkUpdate.description,
            gateways: [] //for this first test, don't add gateways  
        };

        const fakeNetworkUpdate2: NetworkDTO = {
            description: "Description gets updated twice"   //updated
        };

        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            getNetworkByNetworkCode: jest.fn().mockResolvedValue(fakeNetworkDAOAfterUpdate1),   //Now, after the first update, this is the new value
            updateNetwork: mockUpdateNetworkMethod
        }));    

        //this is what the mapper function will return:
        const updateAfterMapper2: Partial<NetworkDAO> = {
            networkDescription: fakeNetworkUpdate2.description      //updated
        };


        await networkController.updateNetwork(fakeNetworkDAOAfterUpdate1.networkCode, fakeNetworkUpdate2);


        //check updateNetwork called correctly
        //check the mapper function mapNetworkDTOToPartialDAO has returned the correct value, so updateAfterMapper
        //since in the real implementation inside the controller we have:
        //await networkRepo.updateNetwork(oldnetworkCode, mapNetworkDTOToPartialDAO(filteredNetwork));
        expect(mockUpdateNetworkMethod).toHaveBeenCalledWith(fakeNetworkDAOAfterUpdate1.networkCode, updateAfterMapper2);
    });


    it("updateNetwork - with nested gateways - mapperService integration", async () => {
        //in this test, the network passed to the updateNetwork method has nested gateways
        //so, the controller has to filter them out
        //and build a networkDTO with just the network fields: code, name and description

        //mock the NetworkDAO, add some gateways
        const fakeNetworkDAO: NetworkDAO = {
            networkCode: "testNetwork",
            networkName: "Test Network",
            networkDescription: "This is a test network",
            gateways: []  
        };
        const fakeGatewayDAO: GatewayDAO = {
            gatewayMac: "00:00:00:00:00:01",
            gatewayName: "Test Gateway 1",
            gatewayDescription: "This is a test gateway 1",
            network: fakeNetworkDAO,
            sensors: [] //for this first test, don't add sensors
        };
        const fakeGatewayDAO2: GatewayDAO = {
            gatewayMac: "00:00:00:00:00:02",
            gatewayName: "Test Gateway 2",
            gatewayDescription: "This is a test gateway 2",
            network: fakeNetworkDAO,
            sensors: [] //for this first test, don't add sensors
        };

        fakeNetworkDAO.gateways.push(fakeGatewayDAO);
        fakeNetworkDAO.gateways.push(fakeGatewayDAO2);


        //this is the request body that will be passed to the controller
        //the controller has to FILTER OUT any nested entity!
        const fakeNetworkUpdate: NetworkDTO = {
            code: "testNetworkUpdated",
            name: "Test Network Updated",
            description: "This is a test network updated",
            gateways: [
                {
                    macAddress: fakeGatewayDAO.gatewayMac,
                    name: fakeGatewayDAO.gatewayName,
                    description: fakeGatewayDAO.gatewayDescription
                },
                {
                    macAddress: fakeGatewayDAO2.gatewayMac,
                    name: fakeGatewayDAO2.gatewayName,
                    description: fakeGatewayDAO2.gatewayDescription
                }
            ]
        };

        //this is what we expect the controller to pass to the mapper service:
        const filteredNetwork: NetworkDTO = {
            code: fakeNetworkUpdate.code,
            name: fakeNetworkUpdate.name,
            description: fakeNetworkUpdate.description
        };

        //mock the repo
        const mockUpdateNetworkMethod = jest.fn().mockResolvedValue(Promise.resolve());
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            getNetworkByNetworkCode: jest.fn().mockResolvedValue(fakeNetworkDAO), //repo always eagerly loads gateways and gateways.sensors
            updateNetwork: mockUpdateNetworkMethod
        }));

        //check mapNetworkDTOToPartialDAO called correctly
        const updateAfterMapper: Partial<NetworkDAO> = {
            networkCode: filteredNetwork.code,
            networkName: filteredNetwork.name,
            networkDescription: filteredNetwork.description
        };

        //so, the controller receives the request body with nested entities
        //then it filters out the nested entities and passes the filtered network to the mapper service
        //the mapper service maps the filtered network to a Partial<NetworkDAO>
        //we have to check all this process is done correctly
        await networkController.updateNetwork(fakeNetworkDAO.networkCode, fakeNetworkUpdate);



        //check updateNetwork called correctly
        expect(mockUpdateNetworkMethod).toHaveBeenCalledWith(fakeNetworkDAO.networkCode, updateAfterMapper);
    });

    it("createNetwork - - no nested gateways", async () => {
        //mock the NetworkDAO
        const fakeNetworkDAO: NetworkDAO = {
            networkCode: "testNetwork",
            networkName: "Test Network",
            networkDescription: "This is a test network",
            gateways: [] //for this first test, don't add gateways  
        };

        const fakeNetworkDTO: NetworkDTO = {
            code: fakeNetworkDAO.networkCode,
            name: fakeNetworkDAO.networkName,
            description: fakeNetworkDAO.networkDescription,
        };

        //mock te resolved value of the getAllNetworks method
        //it will return the three network DAOs
        const mockCreateNetwork = jest.fn().mockResolvedValue(fakeNetworkDAO);
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            createNetwork: mockCreateNetwork
        }));

        //now, it's the mapper service duty to map the DAOs to DTOs
        //this is called by the controller function
        await networkController.createNetwork(fakeNetworkDTO);
        expect(mockCreateNetwork).toHaveBeenCalledWith(fakeNetworkDTO.code, fakeNetworkDTO.name, fakeNetworkDTO.description);
    });


    it("createNetwork - with nested gateways", async () => {
        //mock the NetworkDAO
        const fakeNetworkDAO: NetworkDAO = {
            networkCode: "testNetwork",
            networkName: "Test Network",
            networkDescription: "This is a test network",
            gateways: [] //for this first test, don't add gateways  
        };
        const fakeGatewayDAO: GatewayDAO = {
            gatewayMac: "00:00:00:00:00:01",
            gatewayName: "Test Gateway 1",
            gatewayDescription: "This is a test gateway 1",
            network: fakeNetworkDAO,
            sensors: [] //for this first test, don't add sensors
        };

        fakeNetworkDAO.gateways.push(fakeGatewayDAO);

        //this is the request body that will be passed to the controller
        //the controller has to FILTER OUT any nested entity!
        const fakeNetworkDTO: NetworkDTO = {
            code: fakeNetworkDAO.networkCode,
            name: fakeNetworkDAO.networkName,
            description: fakeNetworkDAO.networkDescription,
            gateways: [
                {
                    macAddress: fakeGatewayDAO.gatewayMac,
                    name: fakeGatewayDAO.gatewayName,
                    description: fakeGatewayDAO.gatewayDescription
                }
            ]
        };

        //mock the repo
        const mockCreateNetwork = jest.fn().mockResolvedValue(fakeNetworkDAO);
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            createNetwork: mockCreateNetwork
        }));


        //so, the controller receives the request body with nested entities
        //then it filters out the nested entities and passes the filtered network to the mapper service
        //the mapper service maps the filtered network to a Partial<NetworkDAO>
        //we have to check all this process is done correctly
        await networkController.createNetwork(fakeNetworkDTO);

        //check updateNetwork called correctly
        expect(mockCreateNetwork).toHaveBeenCalledWith(fakeNetworkDTO.code, fakeNetworkDTO.name, fakeNetworkDTO.description);
    });


    it("delete network", async () => {
        //mock the NetworkDAO
        const fakeNetworkDAO: NetworkDAO = {
            networkCode: "testNetwork",
            networkName: "Test Network",
            networkDescription: "This is a test network",
            gateways: [] //for this first test, don't add gateways  
        };

        //mock te resolved value of the getAllNetworks method
        //it will return the three network DAOs
        const mockDeleteNetwork = jest.fn().mockResolvedValue(Promise.resolve());
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            deleteNetwork: mockDeleteNetwork
        }));

        //now, it's the mapper service duty to map the DAOs to DTOs
        //this is called by the controller function
        await networkController.deleteNetwork(fakeNetworkDAO.networkCode);
        expect(mockDeleteNetwork).toHaveBeenCalledWith(fakeNetworkDAO.networkCode);


    });

});

