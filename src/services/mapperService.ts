import { Token as TokenDTO } from "@dto/Token";
import { User as UserDTO, Sensor as SensorDTO, Gateway as GatewayDTO, Network } from "@dto/index";
import { UserDAO } from "@models/dao/UserDAO";
import { ErrorDTO } from "@models/dto/ErrorDTO";
import { UserType } from "@models/UserType";
import { SensorDAO, GatewayDAO, NetworkDAO } from "@dao/index";
import { Sensor } from '../models/dto/Sensor';

export function createErrorDTO(
  code: number,
  message?: string,
  name?: string
): ErrorDTO {
  return removeNullAttributes({
    code,
    name,
    message
  }) as ErrorDTO;
}

export function createTokenDTO(token: string): TokenDTO {
  return removeNullAttributes({
    token: token
  }) as TokenDTO;
}

export function createUserDTO(
  username: string,
  type: UserType,
  password?: string
): UserDTO {
  return removeNullAttributes({
    username,
    type,
    password
  }) as UserDTO;
}

export function mapUserDAOToDTO(userDAO: UserDAO): UserDTO {
  return createUserDTO(userDAO.username, userDAO.type);
}

export function createSensorDTO(
  sensorMac: string,
  sensorName: string,
  sensorDescription: string,
  sensorVariable: string,
  sensorUnit: string
): SensorDTO {
  return removeNullAttributes({
    macAddress: sensorMac,
    name: sensorName,
    description: sensorDescription,
    variable: sensorVariable,
    unit: sensorUnit
   }) as SensorDTO;
}

export function mapSensorDAOToDTO(sensorDAO: SensorDAO): SensorDTO {
  return createSensorDTO(
    sensorDAO.sensorMac,
    sensorDAO.sensorName,
    sensorDAO.sensorDescription,
    sensorDAO.sensorVariable,
    sensorDAO.sensorUnit
  );
}

export function createSensorPartialDAO(
  sensorMac?: string,
  sensorName?: string,
  sensorDescription?: string,
  sensorVariable?: string,
  sensorUnit?: string
): Partial<SensorDAO> {
  return removeNullAttributes({
    sensorMac,
    sensorName,
    sensorDescription,
    sensorVariable,
    sensorUnit
  }) as Partial<SensorDAO>;
}

export function mapSensorDTOToPartialDAO(sensorDTO: SensorDTO): Partial<SensorDAO> {
  return createSensorPartialDAO(
    sensorDTO.macAddress,
    sensorDTO.name,
    sensorDTO.description,
    sensorDTO.variable,
    sensorDTO.unit
  );
}

export function createGatewayDTO(
  gatewayMac: string,
  gatewayName: string,
  gatewayDescription: string,
  sensors: SensorDTO[]
): GatewayDTO {
  return removeNullAttributes({
    macAddress: gatewayMac,
    name: gatewayName,
    description: gatewayDescription,
    sensors
  }) as GatewayDTO;
}

export function createGatewayPartialDAO(
  gatewayMac?: string,
  gatewayName?: string,
  gatewayDescription?: string,
  sensors?: SensorDTO[]
): Partial<GatewayDAO> {
  return removeNullAttributes({
    gatewayMac,
    gatewayName,
    gatewayDescription,
    sensors
  }) as Partial<GatewayDAO>;
}

export function mapGatewayDTOToPartialDAO(gatewayDTO: GatewayDTO): Partial<GatewayDAO> {
  return createGatewayPartialDAO(
    gatewayDTO.macAddress,
    gatewayDTO.name,
    gatewayDTO.description,
    gatewayDTO.sensors
  );

}


export function mapGatewayDAOToDTO(gatewayDAO: GatewayDAO): GatewayDTO {
  
  if (gatewayDAO.sensors && gatewayDAO.sensors.length > 0) {
    //map first sensors DAOs to DTOs
    const sensors = gatewayDAO.sensors.map((sensorDAO) =>
      mapSensorDAOToDTO(sensorDAO)
    );
    return createGatewayDTO(
      gatewayDAO.gatewayMac,
      gatewayDAO.gatewayName,
      gatewayDAO.gatewayDescription,
      sensors
    );
  } else {
    //gateway has no sensors attached to it
    return createGatewayDTO(
      gatewayDAO.gatewayMac,
      gatewayDAO.gatewayName,
      gatewayDAO.gatewayDescription,
      [] //no sensors, so leave it intentionally null
    );
  }
  
}

function removeNullAttributes<T>(dto: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(dto).filter(
      ([_, value]) =>
        value !== null &&
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0)
    )
  ) as Partial<T>;
}



export function createNetworkDTO(
  code: string,
  name: string,
  description: string,
  gateways: GatewayDTO[]
): Network {
  return removeNullAttributes({
    code: code,
    name: name,
    description: description,
    gateways: gateways
  }) as Network;
}

export function createNetworkPartialDAO(
  networkCode?: string,
  networkName?: string,
  networkDescription?: string,
): Partial<NetworkDAO> {
  return removeNullAttributes({
    networkCode: networkCode,
    networkName: networkName,
    networkDescription: networkDescription
  }) as Partial<NetworkDAO>;
}

export function mapNetworkDTOToPartialDAO(networkDTO: Network): Partial<NetworkDAO> {
  return createNetworkPartialDAO(
    networkDTO.code,
    networkDTO.name,
    networkDTO.description
  );
}

export function mapNetworkDAOToDTO(networkDAO: NetworkDAO): Network{
  if (networkDAO.gateways && networkDAO.gateways.length > 0) {
    //map first gateways DAOs to DTOs
    const gateways = networkDAO.gateways.map((gatewayDAO) =>
      mapGatewayDAOToDTO(gatewayDAO)
    );
    return createNetworkDTO(
      networkDAO.networkCode,
      networkDAO.networkName,
      networkDAO.networkDescription,
      gateways
    );
  } else {
    //network has no gateways attached to it
    return createNetworkDTO(
      networkDAO.networkCode,
      networkDAO.networkName,
      networkDAO.networkDescription,
      [] //no gateways, so leave it intentionally null
    );
  }

}
