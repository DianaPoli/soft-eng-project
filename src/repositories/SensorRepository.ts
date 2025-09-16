/**
 * GatewayRepository.ts
 * Creation Date: 2025-05-06
 * Last Revision Date: 2025-05-07
 * SWE Group 54
 */
import { AppDataSource } from "@database";
import { Repository, EntityNotFoundError, DeleteResult, UpdateResult, Not, FindManyOptions } from "typeorm";
import { GatewayDAO, NetworkDAO, SensorDAO } from "@dao/index";
import { findOrThrowNotFound, throwConflictIfFound, throwIfNotFound } from "@utils";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { In, FindOptionsWhere } from "typeorm";


/**
 * Interface defining the contract for the Sensor Repository.
 * This abstracts the database access logic.
 */
export interface ISensorRepository {
    /**
     * Retrieve all sensors from the database.
     * @param {loadGateway} loadGateway - If true, the gateway will be eagerly loaded.
     * @returns {SensorDAO[]} - An array of SensorDAO objects.
     */
    getAllSensors(loadGateway?: boolean): Promise<SensorDAO[]>;

    /**
     * Retrieve all sensors within a gateway in the network.
     * @param {networkCode} networkCode - The code of the network of the gateway
     * @param {gatewayMac} gatewayMac - The code of the gateway
     * @param {loadGateway} loadGateway - If true, the gateway will be eagerly loaded.
     * @return {SensorDAO[]} - An array of SensorDAO objects.
     * @throws {NotFoundError} - If either the network or the gateway is not found.
     */
    getAllSensorsByNetworkCodeGatewayMac(
        networkCode: string,
        gatewayMac: string,
        loadGateway?: boolean
    ): Promise<SensorDAO[]>;


    /**
     * Retrieve a specific sensors within a gateway in the network by its sensorCode.
     * @param {networkCode} networkCode - The code of the network of the gateway
     * @param {gatewayMac} gatewayMac - The code of the gateway
     * @param {sensorMac} sensorMac - The code of the sensor to retrieve.
     * @param {loadGateway} loadGateway - If true, the gateway will be eagerly loaded.
     * @return {SensorDAO} - The SensorDAO object corresponding to the provided sensorCode.
     * @throws {NotFoundError} - If either the network, the gateway or the sensor is not found.
     */
    getSensorByNetworkCodeGatewayMacSensorMac(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string,
        loadGateway?: boolean
    ): Promise<SensorDAO>;

    /**
     * Create a new sensor for a specific gateway in the network.
     * @param {networkCode} networkCode - The code of the network of the gateway
     * @param {gatewayMac} gatewayMac - The code of the gateway
     * @param {sensorMac} sensorMac - The code of the sensor to create.
     * @param {sensorName} sensorName - The name of the sensor to create.
     * @param {sensorDescription} sensorDescription - The description of the sensor to create.
     * @param {sensorVariable} sensorVariable - The variable of the sensor to create.
     * @param {sensorUnit} sensorUnit - The unit of the sensor to create.
     * @returns {SensorDAO} - The created SensorDAO object.
     * @throws {ConflictError} - If a sensor with the same sensorCode already exists in the gateway.
     * @throws {NotFoundError} - If either the network or the gateway is not found.
     */
    createSensor(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string,
        sensorName?: string,
        sensorDescription?: string,
        sensorVariable?: string,
        sensorUnit?: string
    ): Promise<SensorDAO>;


    /**
     * Update an existing sensor for a specific gateway in the network.
     * @param {networkCode} networkCode - The code of the network of the gateway
     * @param {gatewayMac} gatewayMac - The code of the gateway
     * @param {sensorMac} oldSensorMac - The old code of the sensor to update.
     * @param {Partial<SensorDAO>} sensorUpdate - A Partial<SensorDAO> object containing the new values for updating the sensor. All the fields are optional, so you can update only the fields you want.
     * @returns {void} - void
     * @throws {ConflictError} - If a sensor with the same new sensorMac already exists in the gateway.
     * @throws {NotFoundError} - If either the network, the gateway or the sensor is not found.
     */
    updateSensor(
        networkCode: string,
        gatewayMac: string,
        oldSensorMac: string,
        sensorUpdate: Partial<SensorDAO>
    ): Promise<void>;


    /**
     * Delete a sensor from a specific gateway in the network.
     * Keep in mind: since the measurements are linked to sensor (sensor -> measurements), deleting a sensor will also delete all the measurements linked to it.
     * All of this is done automatically and in a single transaction by TypeORM, thanks to the onDelete: "CASCADE" options in the various DAOs.
     * @param {networkCode} networkCode - The code of the network of the gateway
     * @param {gatewayMac} gatewayMac - The code of the gateway
     * @param {sensorMac} sensorMac - The code of the sensor to delete.
     * @returns {void} - void
     * @throws {NotFoundError} - If either the network, the gateway or the sensor is not found.
     */
    deleteSensor(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string
    ): Promise<void>;


    /**
     * Gets the list of sensor MAC addresses thta actually exist in the network.
     * and an optional list of requested MACs.
     * @param {string} networkCode The network code.
     * @param {string[]} requestedSensorMacs Optional list of specific sensor MACs requested by the client.
     * @returns A promise that resolves to an array of sensor MAC strings.
     */
    getSensorMacsInNetwork(networkCode: string, requestedSensorMacs?: string[]): Promise<string[]>
}


/**
 * SensorRepository class that implements the ISensorRepository interface.
 * This class is responsible for managing the data access logic for sensors in the database.
 */
export class SensorRepository implements ISensorRepository {

    private repo: Repository<SensorDAO>;
    
    constructor() {
        this.repo = AppDataSource.getRepository(SensorDAO);
    }


    /**
     * @inheritdoc
     */
    getAllSensors(loadGateway: boolean = false): Promise<SensorDAO[]> {
        return this.repo.find(
            {
                relations: loadGateway ? ["gateway"] : [] //if loadGateway is true, eagerly load the gateway relation too
            }
        );
    }

    /**
     * @inheritdoc
     */
    async getAllSensorsByNetworkCodeGatewayMac(
        networkCode: string,
        gatewayMac: string,
        loadGateway: boolean = false
    ): Promise<SensorDAO[]> {

        //check network exists, gateway exists and belongs to the network
        throwIfNotFound(
            await AppDataSource.getRepository(GatewayDAO).findOne({
                where: {
                    gatewayMac,
                    network: { networkCode } //enforce that this gateway is linked to the network
                }
            }),
            'Entity not found'
        )

        return this.repo.find(
            {
                where: { 
                    //match gateway to which the sensor belongs
                    gateway: { 
                        gatewayMac,
                        //match network to which the gateway belongs
                        network: { 
                            networkCode
                        }
                    }
                },
                relations: loadGateway ? ["gateway"] : [] //if loadGateway is true, eagerly load the gateway relation too
            }
        );

    }

    /**
     * @inheritdoc
     */
    async getSensorByNetworkCodeGatewayMacSensorMac(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string,
        loadGateway: boolean = false
    ): Promise<SensorDAO> {

        //check network exists, gateway exists and belongs to the network
        return throwIfNotFound(
            await this.repo.findOne({
                where : {
                    //match sensor
                    sensorMac,
                    //match gateway to which the sensor belongs
                    gateway: {
                        gatewayMac,
                        //match network to which the gateway belongs
                        network: { 
                            networkCode
                        }
                    }
                },
                relations: loadGateway ? ["gateway"] : [] //if loadGateway is true, eagerly load the gateway relation too
            }),
            'Entity not found'       
        )       
    }

    /**
     * @inheritdoc
     */
    async createSensor(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string,
        sensorName?: string,
        sensorDescription?: string,
        sensorVariable?: string,
        sensorUnit?: string
    ): Promise<SensorDAO> {

        //check if sensorMac doens't already exist
        throwConflictIfFound(
            await this.repo.find({ where: { sensorMac: sensorMac } }),
            () => true,
            `Entity with code '${sensorMac}' already exists`
        )

        //also check if the sensorMac is not already used by a gateway
        //since mac address is unique across all devices!
        throwConflictIfFound(
            await AppDataSource.getRepository(GatewayDAO).find({ where: { gatewayMac: sensorMac } }),
            () => true,
            `Entity with code '${sensorMac}' already exists`
        )

        //check network exists, gateway exists and belongs to the network
        const gateway: GatewayDAO =
        throwIfNotFound(
            await AppDataSource.getRepository(GatewayDAO).findOne({
                where: {
                    gatewayMac,
                    network: { networkCode } //enforce that this gateway is linked to the network
                },
            }),
            'Entity not found'
        )

        //now we're clear to create the new sensor
        const newSensor = new SensorDAO();
        newSensor.sensorMac = sensorMac;
        if (sensorName) newSensor.sensorName = sensorName;
        if (sensorDescription) newSensor.sensorDescription = sensorDescription;
        if (sensorVariable) newSensor.sensorVariable = sensorVariable;
        if (sensorUnit) newSensor.sensorUnit = sensorUnit;
        //set foreign key to the gateway
        newSensor.gateway = gateway; 

        return this.repo.save(newSensor);
    }

    /**
     * @inheritdoc
     */
    async updateSensor(
        networkCode: string,
        gatewayMac: string,
        oldSensorMac: string,
        sensorUpdate: Partial<SensorDAO>
    ): Promise<void> {

        //check if the new sensorMac is already in use by another device
        if (sensorUpdate.sensorMac) {
            if (sensorUpdate.sensorMac !== oldSensorMac) {
                throwConflictIfFound(
                    await this.repo.find({ where: { sensorMac: sensorUpdate.sensorMac } }),
                    () => true,
                    `Entity with code '${sensorUpdate.sensorMac}' already exists`
                )

                //also check if the sensorMac is not already used by a gateway
                //since mac address is unique across all devices!
                throwConflictIfFound(
                    await AppDataSource.getRepository(GatewayDAO).find({ where: { gatewayMac: sensorUpdate.sensorMac } }),
                    () => true,
                    `Entity with code '${sensorUpdate.sensorMac}' already exists`
                )
            }
        }


        //find network exist and the gateway exists and belongs to the network
        throwIfNotFound(
            await AppDataSource.getRepository(GatewayDAO).findOne({
                where: {
                    gatewayMac,
                    network: { networkCode: networkCode } //enforce that this gateway is linked to the network
                }
            }),
            'Entity not found'
        );

        //update the sensor only it it matches the sensrMac, belongs to the gateway and its gateway is linked to the network
        const updateResult: UpdateResult = await this.repo.update(
            {
                //match sensor to update
                sensorMac: oldSensorMac,   
                //match gateway to which the sensor belongs
                gateway: {
                    gatewayMac: gatewayMac,
                }
            },
            sensorUpdate        
        );

        //check if the update was successful
        //if is was, the total line affected would be 1, if not, it would be 0
        //if it is 0, it means that the sensor was not found or the gateway is not found/not linked to the network or the network is not found
        //so, throw a NotFoundError
        if (updateResult.affected === 0) {
            throw new NotFoundError('Entity not found');
        }
        
       
    }

    /**
     * @inheritdoc
     */
    async deleteSensor(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string
    ): Promise<void> {

        //find network exist and the gateway exists and belongs to the network
        throwIfNotFound(
            await AppDataSource.getRepository(GatewayDAO).findOne({
                where: {
                    gatewayMac,
                    network: { networkCode: networkCode } //enforce that this gateway is linked to the network
                }
            }),
            'Entity not found'
        );
        
        //delete the sensor with the given sensorMac, that belongs to the gateway with the given gatewayMac and the network with the given networkCode
        const deleteResult: DeleteResult = await this.repo.delete({
            sensorMac: sensorMac,
            gateway: {
                gatewayMac
            }
        });

        //check if the sensor was found and deleted
        //if sensor was deleted, rowsAffected will be 1 -> 1 row deleted from sensors table
        //if sensor was not found, rowsAffected will be 0
        if (deleteResult.affected === 0) {
            throw new NotFoundError('Entity not found');
        }
    }


    /**
     * @inheritdoc
     */
    async getSensorMacsInNetwork(networkCode: string, requestedSensorMacs?: string[]): Promise<string[]>{
        //base condition: sensor must be in the network
        const networkCondition: FindOptionsWhere<SensorDAO> = {
            gateway: {
                network: {
                    networkCode
                }
            }
        }

        const finalWhereCondition: FindOptionsWhere<SensorDAO> = networkCondition;

        if(requestedSensorMacs && requestedSensorMacs.length > 0) {
            //if requestedSensorMacs is not empty, we want to filter by sensorMac too
            finalWhereCondition.sensorMac = In(requestedSensorMacs);
        }

        //select te mathcing sensors DAOs
        const sensorDAOs = await this.repo.find({ // Changed variable name for clarity
            where: finalWhereCondition,
            select: {
                sensorMac: true
            }
        });

        //map the result to an array of strings
        //so, from sensorDAO to string of sensorMac
        return sensorDAOs.map((sensorDAO) => sensorDAO.sensorMac);
    }

}