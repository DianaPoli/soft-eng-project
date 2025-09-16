/**
 * GatewayRepository.ts
 * Creation Date: 2025-05-02
 * Last Revision Date: 2025-05-17 -> fixed nullable fields
 * SWE Group 54
 */
import { AppDataSource } from "@database";
import { Repository, EntityNotFoundError, DeleteResult, UpdateResult } from "typeorm";
import { GatewayDAO, NetworkDAO, SensorDAO } from "@dao/index";
import { findOrThrowNotFound, throwConflictIfFound, throwIfNotFound } from "@utils";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";


/**
 * Interface defining the contract for the Gateway Repository.
 * This abstracts the database access logic.
 */
export interface IGatewayRepository {


    /**
     * Retrieve all gateways from the database.
     * Sensors are always eagerly loaded.
     * @param {boolean} [loadNetwork=false] - Whether to load also the network relation (upper relation) or not. Default is false.
     * @returns {GatewayDAO[]} - An array of GatewayDAO objects.
     */
    getAllGateways(loadNetwork?: boolean): Promise<GatewayDAO[]>;

    /**
     * Get all gateways from the database that belong to a specific network.
     * Sensors are always eagerly loaded.
     * @param {string} networkCode - The code of the network to which the gateways belong.
     * @param {boolean} [loadNetwork=false] - Whether to load also the network relation (upper relation) or not. Default is false.
     * @returns {GatewayDAO[]} - An array of GatewayDAO objects.
     * @throws {NotFoundError} - If no network is found with the provided networkCode.
     */
    getAllGatewaysByNetworkCode(networkCode: string, loadNetwork?: boolean): Promise<GatewayDAO[]>; 

    /**
     * Retrieve a specific gateway by its networkCode and gatewayMac.
     * Sensors are always eagerly loaded.
     * @param {string} networkCode - The code of the network to which the gateway belongs.
     * @param {string} gatewayMac - The code of the gateway to retrieve.
     * @param {boolean} [loadNetwork=false] - Whether to load also the network relation (upper relation) or not. Default is false.
     * @returns {GatewayDAO} - The GatewayDAO object corresponding to the provided gatewayCode.
     * @throws {NotFoundError} - If no either the network or the gateway is not found with the provided networkCode and gatewayMac.
     */
    getGatewayByNetworkCodeGatewayMac(networkCode: string, gatewayMac: string, loadNetwork?: boolean): Promise<GatewayDAO>;


    /**
     * Create a new gateway in the database.
     * @param {string} networkCode - The code of the network to which the gateway belongs.
     * @param {string} gatewayMac - The code of the gateway to create.
     * @param {string} gatewayName - The name of the gateway to create.
     * @param {string} gatewayDescription - The description of the gateway to create.
     * @returns {GatewayDAO} - The created GatewayDAO object.
     * @throws {NotFoundError} if the network with the given networkCode does not exist.
     * @throws {ConflictError} if a gateway with the same gatewayMac already exists.
     */
    createGateway(
        networkCode: string,
        gatewayMac: string,
        gatewayName?: string,
        gatewayDescription?: string
    ): Promise<GatewayDAO>;


    /**
     * Update an existing gateway in the database.
     * Keep in mind: if we update the gatewayMac, all the sensors linked to the gateway will have this field updated too.
     * This is thanks to the cascade option in the GatewayDAO entity.
     * @param {string} networkCode - The code of the network to which the gateway belongs.
     * @param {string} oldGatewayMac - The old code of the gateway to update.
     * @param {Partial<GatewayDAO>} gatewayUpdate - A Partial<GatewayDAO> object containing the new values for updating the gateway. All the fields are optional, so you can update only the fields you want.
     * The Partial<GatewayDAO> will be built by the gateway controller from the GatewayUpdate DTO. Here we don't manage the DTO but only the Partial<GatewayDAO> object.
     * @returns {void} void
     * @throws {ConflictError} - If a gateway with the same gatewayMac already exists.
     * @throws {NotFoundError} - If no gateway is found with the provided oldGatewayMac.
     */
    updateGateway(
        networkCode: string,
        oldGatewayMac: string,
        gatewayUpdate: Partial<GatewayDAO>
    ): Promise<void>;

    /**
     * Delete a gateway from the database.
     * Keep in mind: since sensors are linked to the gateway (gateway -> sensor), deleting a gateway will also delete all the sensors linked to it.
     * If we have measurements linked to the sensors, they will be deleted too.
     * This is thanks to the cascade option in the GatewayDAO entity.
     * @param {string} networkCode - The code of the network to which the gateway belongs.
     * @param {string} gatewayMac - The code of the gateway to delete.
     * @returns {void} void
     * @throws {NotFoundError} - If either no gateway is found with the provided gatewayMac, or the network with the given networkCode does not exist.
     */
    deleteGateway(networkCode: string, gatewayMac: string): Promise<void>;

}


/**
 * GatewayRepository class
 * This class implements the IGatewayRepository interface and provides the actual implementation of the methods defined in the interface.
 * It uses TypeORM to interact with the database.
 */
export class GatewayRepository implements IGatewayRepository {

    private repo: Repository<GatewayDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(GatewayDAO);
    }

    /**
     * @inheritdoc
     */
    getAllGateways(loadNetwork: boolean = false): Promise<GatewayDAO[]> {
        //returns all the gateways in the database (like a SELECT * FROM gateways)
        return this.repo.find(
            {
                relations: loadNetwork ? ["network", "sensors"] : ["sensors"], //load the network relation (upper relation) only if requested
            }
        )
    }

    /**
     * @inheritdoc
     */
    async getAllGatewaysByNetworkCode(networkCode: string, loadNetwork: boolean = false): Promise<GatewayDAO[]> {
        //get all gateways that belong to the network with the given networkCode

        //In case the db will return an empty array:
        //we have 2 cases:
        //1. Given network exists but there are no gateways in it (so the array is empty)
        //2. Given network does not exist (so the array is empty)

        //So it's better to make two calls to the db, one for first check if the network exists and then get the gateways
        //this way we can separate errors and give more specific messages to the user

        //check if the network with the given networkCode exists
        throwIfNotFound(
            await AppDataSource.getRepository(NetworkDAO).findOne(
                { where: { networkCode } }
            ),
            `Entity not found`
        );

        //if the network exists, get all the gateways that belong to it
        //this can also be an empty array if the network exists but there are no gateways in it
        return this.repo.find(
            {
                where: { network: { networkCode } }, //get all the gateways that belong to the network with the given networkCode
                relations: loadNetwork ? ["network", "sensors"] : ["sensors"], //load the network relation (upper relation) only if requested
            }
        );

    
    }

    /**
     * @inheritdoc
     */
    async getGatewayByNetworkCodeGatewayMac(
        networkCode: string,
        gatewayMac: string,
        loadNetwork: boolean = false
    ): Promise<GatewayDAO> {

        //check both the network and the gateway exist and also the gateway actually belongs to the network
        //it's like a JOIN in SQL and the WHERE clause compares the two foreign keys
        return throwIfNotFound(
            await this.repo.findOne({
                where: {
                    gatewayMac,
                    network: { networkCode } 
                },
                relations: loadNetwork ? ["network", "sensors"] : ["sensors"] //load the network relation (upper relation) only if requested
            }),
            `Entity not found`
        );
        
    }

    /**
     * @inheritdoc
     */
    async createGateway(
        networkCode: string,
        gatewayMac: string,
        gatewayName?: string,
        gatewayDescription?: string
    ): Promise<GatewayDAO> {

        //check if the network with the given networkCode exists
        //if not, throw a NotFoundError since the gateway cannot be created without a network
        let network: NetworkDAO = await AppDataSource.getRepository(NetworkDAO).findOne({ where: { networkCode } });

        if (!network) {
            throw new NotFoundError(`Entity not found`);
        }

        //check if gateways with the same gatewayMac already exists
        //if so, throw a ConflictError since the gateway cannot be created with the same gatewayMac of an already existing other gateway
        throwConflictIfFound(
            await this.repo.find({ where: { gatewayMac } }),
            () => true,
            `Entity with code '${gatewayMac}' already exists`
        );

        //now check also if sensors with the same sensorMac already exists
        //if so, throw a ConflictError since the gateway cannot be created with the same sensorMac of an already existing other sensor
        //MAC address is unique across all devices!!
        throwConflictIfFound(
            await AppDataSource.getRepository(SensorDAO).find({ where: { sensorMac: gatewayMac } }),
            () => true,
            `Entity with code '${gatewayMac}' already exists`
        );



        //create the new gateway
        const newGateway = new GatewayDAO();
        newGateway.gatewayMac = gatewayMac;
        if (gatewayName) newGateway.gatewayName = gatewayName;
        if (gatewayDescription) newGateway.gatewayDescription = gatewayDescription;
        //set the foreign key networkCode in the new gateway, this is done by setting the network property of the new gateway to the network object we just retrieved from the database
        newGateway.network = network;

        //save the new gateway in the database
        return this.repo.save(newGateway);

    }

    /**
     * @inheritdoc
     */
    async updateGateway(
        networkCode: string,
        oldGatewayMac: string,
        gatewayUpdate: Partial<GatewayDAO>
    ): Promise<void> {


        //check if the new gatewayMac is already in use by another device
        if (gatewayUpdate.gatewayMac) {
            if (oldGatewayMac !== gatewayUpdate.gatewayMac) {
                throwConflictIfFound(
                    await this.repo.find({ where: { gatewayMac: gatewayUpdate.gatewayMac } }),
                    () => true,
                    `Entity with code '${gatewayUpdate.gatewayMac}' already exists` 
                );

                //now check also if sensors with the same sensorMac already exists
                //if so, throw a ConflictError since the gateway cannot be created with the same sensorMac of an already existing other sensor
                //MAC address is unique across all devices!!
                throwConflictIfFound(
                    await AppDataSource.getRepository(SensorDAO).find({ where: { sensorMac: gatewayUpdate.gatewayMac } }),
                    () => true,
                    `Entity with code '${gatewayUpdate.gatewayMac}' already exists`
                );
            }
        }

        //perform the update
        //update the gateway only if it matches both the gatewayMac and the networkCode
        //this does all the checks needed to check if the gateway exists and if it belongs to the network
        const updateResult = await this.repo.update(
            {
                gatewayMac: oldGatewayMac,
                network: { networkCode }
            },
            gatewayUpdate
        );

        //check if the update was successful, if not, throw a NotFoundError
        if (updateResult.affected === 0) {
            throw new NotFoundError(`Gateway with gatewayMac '${oldGatewayMac}' not found, therefore the update cannot be performed`);
        }
    };

    /**
     * @inheritdoc
     */
    async deleteGateway(networkCode: string, gatewayMac: string): Promise<void> {

        //delete the gateway with the given gatewayMac that belongs to the network with the given networkCode
        //so this makes all the checks needed to check if the gateway exists and if it belongs to the network
        const deleteResult: DeleteResult = await this.repo.delete({
            gatewayMac,
            network: { networkCode }
        });

        //check if the delete was successful, if not, throw a NotFoundError
        //if the delete method returns 0 affected rows, it means that the gateway was not found
        //otherwise, the gateway was found and deleted
        if (deleteResult.affected === 0) {
            throw new NotFoundError(`Gateway with gatewayMac '${gatewayMac}' not found, therefore the delete cannot be performed`);
        }
    };

        

    
};