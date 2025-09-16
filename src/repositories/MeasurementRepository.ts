/**
 * NetworkDAO.ts
 * Creation Date: 2025-05-01
 * Last Revision Date: 2025-05-27
 * SWE Group 54
 */
import { AppDataSource } from "@database";
import { Repository, EntityNotFoundError, DeleteResult, UpdateResult, Not, Between, MoreThanOrEqual, LessThanOrEqual, In } from "typeorm";
import { MeasurementDAO, NetworkDAO, SensorDAO} from "@dao/index"
import { NotFoundError } from "@models/errors/NotFoundError";
import { throwIfNotFound } from "@utils";


/**
 * rawSemsorStatsResult type:
 * This type is used to represent the result of a raw sensor statistics query.
 * It contains the MAC address of the sensor, the mean (average) of the measurements and the variance of the measurements.
 * It's introduced since it's more efficient to calculate the mean and variance in the repo levaraging the db engine, rather than in upper layers (ex controllers).
 * So basically, te stack is the following:
 * 1) here in te repo we alreasdy calculate the mean and variance using the db engine, so we don't have to do it in the controller layer
 * 2) the controller will use these 2 values to calculate the std deviation and the confidence interval, so we don't have to do it in the repo layer
 * 3) the interval will be used to label the measurements as outliers or not...this will all done with DTOs, not DAOs, by the controller
*/
export type rawSensorStatsResult = {
    sensorMac: string, //grouped by sensorMac
    mean: number, //average of the measurements
    var: number, //variance of the measurements
}


/**
 * Interface defining the contract for the Measurement Repository.
 * This abstracts the database access logic.
 */
export interface IMeasurementRepository {

    /**
     * Retrieves measurements for a specific network and optional sensors belonging to that network within an optional date range.
     * @param networkCode The unique alphanumeric code of the network.
     * @param sensorMacs Optional array of sensor MAC addresses to filter the measurements.
     * If empty or undefined, measurements for all sensors in the network are returned.
     * @param startDate Optional start date (inclusive) for the measurement interval. It must be in ISO 8601 format with timezone.
     * @param endDate Optional end date (inclusive) for the measurement interval. It must be in ISO 8601 format with timezone.
     * @returns A promise resolving to an array of MeasurementDAO entities.
     * @throws {NotFoundError} If the network is not found.
     */
    getMeasurementsByNetworkAndSensors(
        networkCode: string,
        sensorMacs?: string[],
        startDate?: Date,
        endDate?: Date
    ): Promise<MeasurementDAO[]>;



    /**
     * Store a measurement for a specific sensor in the database.
     * @param NetworkCode The unique alphanumeric code of the network.
     * @param gatewayMac The MAC address of the gateway.
     * @param sensorMac The MAC address of the sensor.
     * @param createdAt The timestamp of the measurement in ISO 8601 format with local timezone.
     * @param value The value of the measurement (can be either float or int).
     * @returns A promise resolving to the created MeasurementDAO entity.
     * @throws Any database-related errors.
     */
    createMeasurement(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string,
        createdAt: Date,
        value: number
    ): Promise<MeasurementDAO>;


    /**
     * Retrieves measurements for a specific sensor within an optional date range.
     * @param networkCode The unique alphanumeric code of the network.
     * @param gatewayMac The MAC address of the gateway.
     * @param sensorMac The MAC address of the sensor.
     * @param startDate Optional start date (inclusive) for the measurement interval. It must be in ISO 8601 format with timezone.
     * @param endDate Optional end date (inclusive) for the measurement interval. It must be in ISO 8601 format with timezone.
     * @returns A promise resolving to an array of MeasurementDAO entities.
     * @throws Any database-related errors.
     */
    getMeasurementsBySensor(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<MeasurementDAO[]>;


}


/**
 * MeasurementRepository class: 
 * TypeORM implementation of the IMeasurementRepository interface.
 * Interacts directly with the database using TypeORM entities.
 */
export class MeasurementRepository implements IMeasurementRepository {

    //INCOMPLETE!

    private MeasurementRepo : Repository<MeasurementDAO>;


    constructor() {
        //Initialize the repository for MeasurementDAO
        this.MeasurementRepo = AppDataSource.getRepository(MeasurementDAO);
      
    }

    /**
     * @inheritdoc
     */
    async getMeasurementsByNetworkAndSensors(
        networkCode: string,
        sensorMacs?: string[],
        startDate?: Date,
        endDate?: Date
    ): Promise<MeasurementDAO[]> {

        
        //if networkCode is not found, throw an error
        throwIfNotFound(
            await AppDataSource.getRepository(NetworkDAO).findOne({
                where: { networkCode }
            }),
            'Entity not found'
        );

        const where: any = {
            sensor: {
                gateway: {
                    network: {
                        networkCode
                    }
                }
            }
        };

        if (sensorMacs && sensorMacs.length > 0) {
            //if one or more sensorMacs are invalid (i.e. not found in the db), they are simply ignored
            //so, at the end, we will return an arrya containing just the DAOs related to existing sensorMacs
            where.sensor.sensorMac = In(sensorMacs);
        }

        if (startDate && endDate) {
            where.createdAt = Between(startDate, endDate);
        } else if (startDate) {
            where.createdAt = MoreThanOrEqual(startDate);
        } else if (endDate) {
            where.createdAt = LessThanOrEqual(endDate);
        } //else: no dates filtering

        const results = await this.MeasurementRepo.find({
            where,
            relations: ["sensor"] //just eagerly load sensor, for the sensorMac
        });

        //if all the mac Address are not found, or if we have no measurements, an empty array is returned

        return results;

    }



    /**
     * @inheritdoc
     */
    async createMeasurement(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string,
        createdAt: Date,
        value: number
    ): Promise<MeasurementDAO> {

        let sensorFound = await AppDataSource.getRepository(SensorDAO).findOne({
            where:
            { sensorMac: sensorMac },
            relations: ["gateway", "gateway.network"] 
        });
        
        
    
        //check if sensor exists and belongs to the correct gateway/network
        if (!sensorFound) {
            throw new NotFoundError(`Entity not found`);
        }
        if (sensorFound.gateway.gatewayMac !== gatewayMac) {
             throw new NotFoundError(`Entity not found`);
        }
         if (sensorFound.gateway.network.networkCode !== networkCode) {
            throw new NotFoundError(`Entity not found`);
        }



        const newMeasurement = new MeasurementDAO();
        newMeasurement.createdAt = createdAt;
        newMeasurement.value = value;
        newMeasurement.sensor = sensorFound; // Set the sensor relation

        //Create the measurement in the database
        return this.MeasurementRepo.save(newMeasurement);
    }


    /**
     * @inheritdoc
     */
    async getMeasurementsBySensor(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<MeasurementDAO[]> {

        //first check if the networkCode, gatewayMac and sensorMac are valid
        throwIfNotFound(
            await AppDataSource.getRepository(SensorDAO).findOne({
                where: {
                    sensorMac,
                    gateway: {
                        gatewayMac,
                        network: {
                            networkCode
                        }
                    }
                }
            }),
            'Entity not found'
        );

        const where: any = {
        sensor: {
            sensorMac,
            gateway: {
                gatewayMac,
                network: {
                    networkCode
                    }
                }
            }
        };
        //check dates, if they are provided, filter by them to just get stats for createdAt in that range
        if (startDate && endDate) {
            where.createdAt = Between(startDate, endDate);
        } else if (startDate) {
            where.createdAt = MoreThanOrEqual(startDate);
        } else if (endDate) {
            where.createdAt = LessThanOrEqual(endDate);
        }

        const results = await this.MeasurementRepo.find({
            where,
            relations: ["sensor", "sensor.gateway", "sensor.gateway.network"]
        });

        //if networkCode, gatewayMac and sensorMac are found, but no measurements are found, an empty array is returned

        return results;
    }

}

