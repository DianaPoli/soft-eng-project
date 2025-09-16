/**
 * networkController.ts
 * Creation Date: 2025-05-13
 * Last Revision Date: 2025-05-15
 * SWE Group 54
 */

import { NetworkDAO } from "@models/dao";
import { Network as NetworkDTO } from "@models/dto";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { mapNetworkDAOToDTO, mapNetworkDTOToPartialDAO } from "@services/mapperService";

/**
 * Get all networks
 * @returns {Promise<NetworkDTO[]>} - An array of NetworkDTO objects
 */
export async function getAllNetworks(): Promise<NetworkDTO[]>{
    const networkRepo = new NetworkRepository();
    return (await networkRepo.getAllNetworks()).map((network: NetworkDAO) => {
        return mapNetworkDAOToDTO(network); 
    })
}

/**
 * Retrieve a network by its code
 * @param {string} networkCode - The network code to filter networks
 * @returns {Promise<NetworkDTO>} - The NetworkDTO object
 * @throws {NotFoundError} - If no network is found with the provided networkCode.
 */
export async function getNetworkByNetworkCode(networkCode: string): Promise<NetworkDTO> {
    const networkRepo = new NetworkRepository();

    return mapNetworkDAOToDTO(await networkRepo.getNetworkByNetworkCode(networkCode));
}

/**
 * Create a new network
 * @param {NetworkDTO} networkDto - The NetworkDTO object to create
 * @returns {Promise<void>} - A promise that resolves when the network is created
 * @throws {ConflictError} if a network with the same code already exists.
 */
export async function createNetwork(networkDto: NetworkDTO): Promise<void> {
    const networkRepo = new NetworkRepository();
    await networkRepo.createNetwork(networkDto.code, networkDto.name, networkDto.description);
}

/**
 * Update a network
 * @param {string} oldnetworkCode - The old network code to filter networks
 * @param {NetworkDTO} networkUpdate - The NetworkDTO object to update
 * @returns {Promise<void>} - A promise that resolves when the network is updated
 * @throws {NotFoundError} - If no network is found with the provided networkCode.
 * @throws {ConflictError} - If a network with the same code already exists.
 */
export async function updateNetwork(oldnetworkCode: string, networkUpdate: NetworkDTO): Promise<void> {
    const networkRepo = new NetworkRepository();

    //since the user could insert nested entities in the request, take just the network
    const filteredNetwork: NetworkDTO = {
        code: networkUpdate.code,
        name: networkUpdate.name,
        description: networkUpdate.description
    };

    await networkRepo.updateNetwork(oldnetworkCode, mapNetworkDTOToPartialDAO(filteredNetwork));
}

/**
 * Delete a network
 * @param {string} networkCode - The network code to filter networks
 * @returns {Promise<void>} - A promise that resolves when the network is deleted
 * @throws {NotFoundError} - If no network is found with the provided networkCode.
 */
export async function deleteNetwork(networkCode: string): Promise<void> {
    const networkRepo = new NetworkRepository();
    await networkRepo.deleteNetwork(networkCode);
}
