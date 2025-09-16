/**
 * GatewayRepository.ts
 * Creation Date: 2025-05-11
 * Last Revision Date: 2025-05-11
 * SWE Group 54
 */
import { Sensor as SensorDTO } from '@dto/Sensor';
import { SensorDAO } from '@dao/SensorDAO';
import { SensorRepository } from '@repositories/SensorRepository';
import { mapSensorDAOToDTO, mapSensorDTOToPartialDAO } from '@services/mapperService';

/**
 * Retrieve all sensors by network code and gateway mac address
 * @param {string} networkCode - The network code to filter sensors
 * @param {string} gatewayMac - The gateway mac address to filter sensors
 * @returns {Promise<SensorDTO[]>} - An array of SensorDTO objects
 * @throws {NotFoundError} - If either the network or the gateway is not found.
 */
export async function getAllSensorsByNetworkCodeGatewayMac(
    networkCode: string,
    gatewayMac: string
): Promise<SensorDTO[]> {

    const sensorRepo = new SensorRepository();
    //retrieve all sensor daos frorm repo
    //the repo can eventually throw a NotFoundError if the network or the gateway is not found
    const sensorsDAOs: SensorDAO[] = await sensorRepo.getAllSensorsByNetworkCodeGatewayMac(
        networkCode,
        gatewayMac
    );

    return sensorsDAOs.map((sensorDAO) =>
        mapSensorDAOToDTO(sensorDAO)
    );

}

/**
 * Retrieve a sensor by its mac address, network code and gateway mac address
 * @param sensorMac - The mac address of the sensor
 * @param networkCode - The network code to filter sensors
 * @param gatewayMac - The gateway mac address to filter sensors
 * @returns {Promise<SensorDTO>} - The SensorDTO object
 * @throws {NotFoundError} - If either the network, the gateway or the sensor is not found.
 */
export async function getSensorByNetworkCodeGatewayMacSensorMac(
    sensorMac: string,
    networkCode: string,
    gatewayMac: string
): Promise<SensorDTO> {

    const sensorRepo = new SensorRepository();
    //retrieve the sensor dao from repo
    //the repo can eventually throw a NotFoundError if the network, the gateway or the sensor is not found
    const sensorDAO: SensorDAO = await sensorRepo.getSensorByNetworkCodeGatewayMacSensorMac(
       networkCode,
       gatewayMac,
       sensorMac
    );

    return mapSensorDAOToDTO(sensorDAO);
    
}


/**
 * Create a new sensor
 * @param sensorDto - The SensorDTO object to create
 * @param networkCode - The network code to associate with the sensor
 * @param gatewayMac - The gateway mac address to associate with the sensor
 * @returns {void} - void
 * @throws {ConflictError} - If a sensor with the same sensorCode already exists in the gateway.
 * @throws {NotFoundError} - If either the network or the gateway is not found.
 */
export async function createSensor(
    sensorDto: SensorDTO,
    networkCode: string,
    gatewayMac: string
): Promise<void> {

    const sensorRepo = new SensorRepository();

    //create the sensor in the repo
    //all the errors are handled by the repo
    await sensorRepo.createSensor(
        networkCode,
        gatewayMac,
        sensorDto.macAddress,
        sensorDto.name,
        sensorDto.description,
        sensorDto.variable,
        sensorDto.unit
    );
}


/**
 * Update an existing sensor
 * @param sensorUpdateDto - The SensorDTO object with updated values
 * @param networkCode - The network code to associate with the sensor
 * @param gatewayMac - The gateway mac address to associate with the sensor
 * @param oldSensorMac - The old mac address of the sensor to update
 * @returns {void} - void
 * @throws {ConflictError} - If a sensor with the same new sensorMac already exists in the gateway.
 * @throws {NotFoundError} - If either the network, the gateway or the sensor is not found.
 */
export async function updateSensor(
    sensorUpdateDto: SensorDTO,
    networkCode: string,
    gatewayMac: string,
    oldSensorMac: string
): Promise<void> {

    const sensorRepo = new SensorRepository();

    //update the sensor in the repo
    //all the errors are handled by the repo
    await sensorRepo.updateSensor(
        networkCode,
        gatewayMac,
        oldSensorMac,
        mapSensorDTOToPartialDAO(sensorUpdateDto)
    );
}


/**
 * Delete a sensor by its mac address, network code and gateway mac address
 * @param networkCode - The network code to filter sensors
 * @param gatewayMac - The gateway mac address to filter sensors
 * @param sensorMac - The mac address of the sensor
 * @returns {void} - void
 * @throws {NotFoundError} - If either the network, the gateway or the sensor is not found.
 */
export async function deleteSensor(
    networkCode: string,
    gatewayMac: string,
    sensorMac: string
): Promise<void> {

    const sensorRepo = new SensorRepository();

    //delete the sensor in the repo
    //all the errors are handled by the repo
    await sensorRepo.deleteSensor(
        networkCode,
        gatewayMac,
        sensorMac
    );
}
