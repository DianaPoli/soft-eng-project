/**
 * NetworkRepository.ts
 * Creation Date: 2025-05-02
 * Last Revision Date: 2025-05-17 -> fixed nullable fields
 * SWE Group 54
 */
import { AppDataSource } from "@database";
import { Repository, EntityNotFoundError, DeleteResult, UpdateResult } from "typeorm";
import { NetworkDAO } from "@dao/index";
import { findOrThrowNotFound, throwConflictIfFound, throwIfNotFound } from "@utils";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

/**
 * Interface defining the contract for the Network Repository.
 * This abstracts the database access logic.
 */
export interface INetworkRepository {


    /**
     * Retrieve all networks from the database.
     * Gateways and sensors are always eagerly loaded.
     * @returns {NetworkDAO[]} - An array of NetworkDAO objects.
     */
    getAllNetworks(): Promise<NetworkDAO[]>;

    /**
     * Retrieve a specific network by its networkCode.
     * Gateways and sensors are always eagerly loaded.
     * @param {string} networkCode - The code of the network to retrieve.
     * @returns {NetworkDAO} - The NetworkDAO object corresponding to the provided networkCode.
     * @throws {NotFoundError} - If no network is found with the provided networkCode.
     */
    getNetworkByNetworkCode(networkCode: string): Promise<NetworkDAO>;

    /**
     * Create a new network in the database.
     * @param {string} networkCode - The code of the network to create.
     * @param {string} networkName - The name of the network to create. Optional.
     * @param {string} networkDescription - The description of the network to create. Optional.
     * @returns {NetworkDAO} - The created NetworkDAO object.
     * @throws {ConflictError} if a network with the same networkCode already exists.
     */
    createNetwork(
        networkCode: string,
        networkName?: string,
        networkDescription?: string
    ): Promise<NetworkDAO>;

    /**
     * Update an existing network in the database.
     * @param {string} oldnetworkCode - The old code of the network to update.
     * @param {Partial<NetworkDAO>} networkUpdate - A Partial<NetworkDAO> object containing the new values for updating the network. All the fields are optional, so you can update only the fields you want.
     * The Partial<NetworkDAO> will be built by the network controller from the NetworkUpdate DTO. Here we don't manage the DTO but only the Partial<NetworkDAO> object.
     * @returns {void} void
     * @throws {ConflictError} - If a network with the same networkCode already exists.
     * @throws {NotFoundError} - If no network is found with the provided oldnetworkCode.
     */
    updateNetwork(
        oldnetworkCode: string,
        networkUpdate: Partial<NetworkDAO>
    ): Promise<void>;



    /**
     * Delete a network from the database.
     * Keep in mind: since gateways and sensors are linked to the network (network -> gateway -> sensor), deleting a network will also delete all the gateways and sensors linked to it. 
     * If we have measurements linked to the sensors, they will be deleted too.
     * All of this is done automatically and in a single transaction by TypeORM, thanks to the onDelete: "CASCADE" options in the various DAOs.
     * @param {string} networkCode - The code of the network to delete.
     * @returns {void}
     * @throws {NotFoundError} - If no network is found with the provided networkCode.
     */
    deleteNetwork(networkCode: string): Promise<void>;


    /**
     * Finds a network by its networkCode or throws a NotFoundError if it doesn't exist.
     * @param {string} networkCode The code of the network to find.
     * @returns {void} void if network is found.
     * @throws NotFoundError if the network is not found.
     */
    findNetworkOrThrow(networkCode: string): Promise<void>;


}


/**
 * Class implementing the INetworkRepository interface.
 * This class provides methods to interact with the NetworkDAO in the database.
 */
export class NetworkRepository implements INetworkRepository {

    private networkRepo: Repository<NetworkDAO>;

    constructor() {
        this.networkRepo = AppDataSource.getRepository(NetworkDAO);
    }


    /**
     * @inheritdoc
     */
    getAllNetworks(): Promise<NetworkDAO[]> {
        //find every network in the database (like SELECT * FROM networks)
        return this.networkRepo.find(
            {
                relations: ["gateways", "gateways.sensors"] //always eagerly load the gateways and sensors relation
            } 
        );
    }


    /**
     * @inheritdoc
     */
    async getNetworkByNetworkCode(networkCode: string): Promise<NetworkDAO> {
        return throwIfNotFound(
            await this.networkRepo.findOne(
                {
                    where: { networkCode },
                    relations: ["gateways", "gateways.sensors"] //always eagerly load the gateways and sensors relation
                }
            ),
            `Entity not found`
        );
    }


    /**
     * @inheritdoc
     */
    async createNetwork(
        networkCode: string,
        networkName?: string,
        networkDescription?: string
    ): Promise<NetworkDAO> {

        //first check another network having the same networkCode does NOT exist
        //if it does, throw a ConflictError
        throwConflictIfFound(
            await this.networkRepo.find({ where: { networkCode } }),
            () => true,
            `Entity with code '${networkCode}' already exists`
        );

        //then we're clear to create the new network
        const newNetwork = new NetworkDAO();
        newNetwork.networkCode = networkCode;
        if (networkName) newNetwork.networkName = networkName;
        if (networkDescription) newNetwork.networkDescription = networkDescription;

        return this.networkRepo.save(newNetwork);
    }

    /**
     * * @inheritdoc
     */
    async updateNetwork(
        oldnetworkCode: string,
        networkUpdate: Partial<NetworkDAO>
    ): Promise<void> {

        //the first check, to check if the network exists, is not needed since at the end the update method will give us the number of affected rows
        //if the network is not found, the update method will return 0 affected rows
        //this will trigger the NotFoundError at the end
        
        
        //then check if the new networkCode already exists
        //if it does, throw a ConflictError
        //if it does not, update the network with the new values
        if (networkUpdate.networkCode) {
            if (networkUpdate.networkCode !== oldnetworkCode) {
                throwConflictIfFound(
                    await this.networkRepo.find({ where: { networkCode: networkUpdate.networkCode } }),
                    () => true,
                    `Entity with code '${networkUpdate.networkCode}' already exists`
                );
            }
        }


        //networkUpdate is a Partial<NetworkDAO>, this means that all the fields are optional
        //so in some cases we can update only some fields, not all of them
        //this is the reason why we use Partial<NetworkDAO> instead of NetworkDAO

        const updateResult: UpdateResult =  await this.networkRepo.update(
            { networkCode: oldnetworkCode }, //where clause to find the network to update
            networkUpdate //new values to update the network with
        )

        //check if the network was found and updated
        if (updateResult.affected === 0) {
            throw new NotFoundError(
                `Entity not found`
            );
        }



    }


    /**
     * @inheritdoc
     */
    async deleteNetwork(networkCode: string): Promise<void> {
        
        const deleteResult: DeleteResult = await this.networkRepo.delete({ networkCode: networkCode });

        //check if the network was found and deleted
        //if network was deleted, rowsAffected will be 1 -> 1 row deleted from networks table
        //if network was not found, rowsAffected will be 0
        if (deleteResult.affected === 0) {
            throw new NotFoundError(
                `Entity not found`
            );
        }
    }

    /**
     * @inheritdoc
     */
    async findNetworkOrThrow(networkCode: string): Promise<void> {
        throwIfNotFound(
            await this.networkRepo.findOne({ where: { networkCode } }),
            `Entity with code '${networkCode}' not found`
        );

        //if the network is found, do nothing
    }
    
}
