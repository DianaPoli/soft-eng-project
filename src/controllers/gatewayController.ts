/**
 * GatewayRepository.ts
 * Creation Date: 2025-05-11
 * Last Revision Date: 2025-05-11
 * SWE Group 54
 */

import { Gateway as GatewayDTO } from '@dto/Gateway';
import { GatewayDAO } from '@dao/GatewayDAO';
import { GatewayRepository } from '@repositories/GatewayRepository';
import { mapGatewayDAOToDTO, mapGatewayDTOToPartialDAO } from '@services/mapperService';


/**
 * Get all gateways attached to the network having the given network code
 * @param {string} networkCode - The network code to filter gateways
 * @returns {Promise<GatewayDTO[]>} - An array of GatewayDTO objects
 * @throws {NotFoundError} - If no network is found with the provided networkCode.
 */
export async function getAllGatewaysByNetworkCode(networkCode: string): Promise<GatewayDTO[]> {
    const gatewayRepo = new GatewayRepository();
    //retrieve all gateway daos from repo
    //the repo can eventually throw a NotFoundError if the network is not found
    const gatewaysDAOs: GatewayDAO[] = await gatewayRepo.getAllGatewaysByNetworkCode(networkCode);

    //map the gateway DAOs to DTOs
    return gatewaysDAOs.map((gatewayDAO) =>
        mapGatewayDAOToDTO(gatewayDAO)
    );
}


/**
 * Retrieve a gateway by its mac address and network code
 * @param {string} gatewayMac - The mac address of the gateway
 * @param {string} networkCode - The network code to filter gateways
 * @returns {Promise<GatewayDTO>} - The GatewayDTO object
 * @throws {NotFoundError} - If either the network or the gateway is not found.
 */
export async function getGatewayByNetworkCodeGatewayMac(gatewayMac: string, networkCode: string): Promise<GatewayDTO> {
    const gatewayRepo = new GatewayRepository();
    //retrieve the gateway dao from repo
    //the repo can eventually throw a NotFoundError if the network or the gateway is not found
    const gatewayDAO: GatewayDAO = await gatewayRepo.getGatewayByNetworkCodeGatewayMac(networkCode, gatewayMac);

    //map the gateway DAO to DTO
    return mapGatewayDAOToDTO(gatewayDAO);
}


/**
 * Create a new gateway associated
 * if passed gatewayDto has sensors, they will be ignored!
 * @param {GatewayDTO} gatewayDto - The GatewayDTO object to create
 * @param {string} networkCode - The network code to associate the gateway with
 * @returns {Promise<void>} - A promise that resolves when the gateway is created
 * @throws {NotFoundError} if the network with the given networkCode does not exist.
 * @throws {ConflictError} if a gateway with the same gatewayMac already exists.
 */
export async function createGateway(gatewayDto: GatewayDTO, networkCode: string): Promise<void> {

    const gatewayRepo = new GatewayRepository();

    //create the new gateway DAO in the db
    //obvsiously, the gateway has no sensors attached to it yet
    //if passed gatewayDto has sensors, they will be ignored! (i.e. we don't pass them to the repo)
    await gatewayRepo.createGateway(
        networkCode,
        gatewayDto.macAddress,
        gatewayDto.name,
        gatewayDto.description,
    );
}

/**
 * Update a gateway. 
 * If passed gatewayDto has sensors, they will be ignored!
 * @param {GatewayDTO} gatewayUpdateDto - The GatewayDTO object to update
 * @param {string} networkCode - The network code to associate the gateway with
 * @param {string} oldGatewayMac - The old mac address of the gateway
 * @returns {Promise<void>} - A promise that resolves when the gateway is updated
 * @throws {ConflictError} - If a gateway with the same gatewayMac already exists.
 * @throws {NotFoundError} - If no gateway is found with the provided oldGatewayMac.
 */
export async function updateGateway(
    gatewayUpdateDto: GatewayDTO,
    networkCode: string,
    oldGatewayMac: string
): Promise<void> {
    const gatewayRepo = new GatewayRepository();

    //if passed gatewayDto has nested sensors, they will be ignored!
    const filteredGatewayDto: GatewayDTO = {
        macAddress: gatewayUpdateDto.macAddress,
        name: gatewayUpdateDto.name,
        description: gatewayUpdateDto.description,
    };

    //update the gateway in the repo
    //all the errors are handled by the repo
    await gatewayRepo.updateGateway(
        networkCode,
        oldGatewayMac,
        mapGatewayDTOToPartialDAO(filteredGatewayDto)
    );
}

/**
 * Delete a gateway by its mac address and network code.
 * If the gateway has sensors, they will be deleted too on cascade.
 * @param {string} networkCode - The network code to filter gateways
 * @param {string} gatewayMac - The mac address of the gateway
 * @returns {Promise<void>} - A promise that resolves when the gateway is deleted
 * @throws {NotFoundError} - If either the network or the gateway is not found.
 */
export async function deleteGateway(networkCode: string, gatewayMac: string): Promise<void> {
    const gatewayRepo = new GatewayRepository();
    //delete the gateway in the repo
    //all the errors are handled by the repo
    await gatewayRepo.deleteGateway(networkCode, gatewayMac);
}
