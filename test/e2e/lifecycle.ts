import {
  initializeTestDataSource,
  closeTestDataSource
} from "@test/setup/test-datasource";
import { UserRepository, NetworkRepository, GatewayRepository, SensorRepository, MeasurementRepository } from "@repositories/index";
import { UserType } from "@models/UserType";

export const TEST_USERS = {
  admin: { username: "admin", password: "adminpass", type: UserType.Admin },
  operator: {
    username: "operator",
    password: "operatorpass",
    type: UserType.Operator
  },
  viewer: { username: "viewer", password: "viewerpass", type: UserType.Viewer }
};

//networks for e2e tests
export const TEST_NETWORKS = {
  network1: {
    networkCode: "NET01",
    networkName: "Network 1",
    networkDescription: "LoRaWAN network",
  },
  network2: {
    networkCode: "NET02",
    networkName: "Network 2",
    networkDescription: "zigbee network",
  },
  //empty network for testing purposes
  //test nullable fields
  network3: {
    networkCode: "NET03"
  },
  length: 3,
};

//gateways for e2e tests
export const TEST_GATEWAYS = {
  gateway1_Net1: {
    networkCode: TEST_NETWORKS.network1.networkCode,
    gatewayMac: "AA:BB:CC:DD:CC:00",
    gatewayName: "Gateway1_NET01",
    gatewayDescription: "LoRaWAN gateway1",
  },

  gateway2_Net1: {
    networkCode: TEST_NETWORKS.network1.networkCode,
    gatewayMac: "AA:BB:CC:DD:EE:10",
    gatewayName: "Gateway2_NET01",
    gatewayDescription: "LoRaWAN gateway2",
  },

  gateway1_Net2: {
    networkCode: TEST_NETWORKS.network2.networkCode,
    gatewayMac: "AA:BB:CC:DD:DD:11",
    gatewayName: "Gateway1_NET02",
    gatewayDescription: "Zigbee gateway1",
  },

  gateway2_Net2: {
    networkCode: TEST_NETWORKS.network2.networkCode,
    gatewayMac: "AA:BB:CC:DD:FF:22",
    gatewayName: "Gateway4_NET02",
    gatewayDescription: "Zigbee gateway2",
  },

  length: 4,
  length_NET1: 2,
  length_NET2: 2,
  length_NET3: 0

}

//sensors for e2e tests
export const TEST_SENSORS = {
  sensor1_gateway1_Net1: {
    networkCode: TEST_NETWORKS.network1.networkCode,
    gatewayMac: TEST_GATEWAYS.gateway1_Net1.gatewayMac,
    sensorMac: "AA:BB:CC:DD:CC:01",
    sensorName: "Sensor1_Gateway1_NET01",
    sensorDescription: "LoRaWAN sensor1",
    sensorVariable: "temperature",
    sensorUnit: "C",
  },

  sensor2_gateway1_Net1: {
    networkCode: TEST_NETWORKS.network1.networkCode,
    gatewayMac: TEST_GATEWAYS.gateway1_Net1.gatewayMac,
    sensorMac: "AA:BB:CC:DD:CC:02",
    sensorName: "Sensor2_Gateway1_NET01",
    sensorDescription: "LoRaWAN sensor2",
    sensorVariable: "humidity",
    sensorUnit: "%",
  },


  sensor1_gateway2_Net1: {
    networkCode: TEST_NETWORKS.network1.networkCode,
    gatewayMac: TEST_GATEWAYS.gateway2_Net1.gatewayMac,
    sensorMac: "AA:BB:CC:DD:EE:11",
    sensorName: "Sensor1_Gateway2_NET01",
    sensorDescription: "LoRaWAN sensor3",
    sensorVariable: "temperature",
    sensorUnit: "C",
  },


  sensor1_gateway1_Net2: {
    networkCode: TEST_NETWORKS.network2.networkCode,
    gatewayMac: TEST_GATEWAYS.gateway1_Net2.gatewayMac,
    sensorMac: "AA:BB:CC:DD:DD:12",
    sensorName: "Sensor1_Gateway1_NET02",
    sensorDescription: "Zigbee sensor1",
    sensorVariable: "temperature",
    sensorUnit: "C",
  },

  sensor2_gateway1_Net2: {
    networkCode: TEST_NETWORKS.network2.networkCode,
    gatewayMac: TEST_GATEWAYS.gateway1_Net2.gatewayMac,
    sensorMac: "AA:BB:CC:DD:DD:13",
    sensorName: "Sensor2_Gateway1_NET02",
    sensorDescription: "Zigbee sensor2",
    sensorVariable: "humidity",
    sensorUnit: "%",
  },

  sensor3_gateway1_Net2: {
    networkCode: TEST_NETWORKS.network2.networkCode,
    gatewayMac: TEST_GATEWAYS.gateway1_Net2.gatewayMac,
    sensorMac: "AA:BB:CC:DD:DD:14",
    sensorName: "Sensor3_Gateway1_NET02",
    sensorDescription: "Zigbee sensor3",
    sensorVariable: "windSpeed",
    sensorUnit: "m/s",
  },

  length: 5,
  length_NET1: 3,
  length_NET2: 3,
  length_NET3: 0,
  length_NET1_gateway1: 2,
  length_NET1_gateway2: 1,
  length_NET2_gateway1: 3,
  length_NET2_gateway2: 0

}

export const TEST_MEASUREMENTS = {
  measurement1_sensor1_gateway1_Net1: {
    networkCode: TEST_SENSORS.sensor1_gateway1_Net1.networkCode,
    gatewatMac: TEST_SENSORS.sensor1_gateway1_Net1.gatewayMac,
    sensorMac: TEST_SENSORS.sensor1_gateway1_Net1.sensorMac,
    createdAt: new Date("2023-01-01T10:00:00Z"),
    value: 23.5,
  },
  measurement2_sensor1_gateway1_Net1: {
    networkCode: TEST_SENSORS.sensor1_gateway1_Net1.networkCode,
    gatewatMac: TEST_SENSORS.sensor1_gateway1_Net1.gatewayMac,
    sensorMac: TEST_SENSORS.sensor1_gateway1_Net1.sensorMac,
    createdAt: new Date("2023-01-01T11:00:00Z"),
    value: 24.1,
  },
  measurement3_sensor1_gateway1_Net1: {
    networkCode: TEST_SENSORS.sensor1_gateway1_Net1.networkCode,
    gatewatMac: TEST_SENSORS.sensor1_gateway1_Net1.gatewayMac,
    sensorMac: TEST_SENSORS.sensor1_gateway1_Net1.sensorMac,
    createdAt: new Date("2023-02-01T10:00:00Z"),
    value: 30.0,
  },
  measurement1_sensor2_gateway1_Net1: {
    networkCode: TEST_SENSORS.sensor2_gateway1_Net1.networkCode,
    gatewatMac: TEST_SENSORS.sensor2_gateway1_Net1.gatewayMac,
    sensorMac: TEST_SENSORS.sensor2_gateway1_Net1.sensorMac,
    createdAt: new Date("2023-01-01T10:00:00Z"),
    value: 45.0,
  },
  measurement1_sensor1_gateway1_Net2: {
    networkCode: TEST_SENSORS.sensor1_gateway1_Net2.networkCode,
    gatewatMac: TEST_SENSORS.sensor1_gateway1_Net2.gatewayMac,
    sensorMac: TEST_SENSORS.sensor1_gateway1_Net2.sensorMac,
    createdAt: new Date("2023-01-01T10:00:00Z"),
    value: 18.5,
  },
  length: 5,
  length_NET1: 4,
  length_NET2: 1,
  length_NET3: 0,
  length_NET1_gateway1_sensor1: 3,
  length_NET1_gateway1_sensor2: 1,
  length_NET1_gateway2_sensor1: 0,
  length_NET2_gateway1_sensor1: 1,
};

export async function beforeAllE2e() {
  await initializeTestDataSource();
  const repo = new UserRepository();
  await repo.createUser(
    TEST_USERS.admin.username,
    TEST_USERS.admin.password,
    TEST_USERS.admin.type
  );
  await repo.createUser(
    TEST_USERS.operator.username,
    TEST_USERS.operator.password,
    TEST_USERS.operator.type
  );
  await repo.createUser(
    TEST_USERS.viewer.username,
    TEST_USERS.viewer.password,
    TEST_USERS.viewer.type
  );

  //Create the 3 networks
  const networkRepo = new NetworkRepository();
  const net1_created = await networkRepo.createNetwork(
    TEST_NETWORKS.network1.networkCode,
    TEST_NETWORKS.network1.networkName,
    TEST_NETWORKS.network1.networkDescription
  );
  expect(net1_created).toBeDefined();
  expect(net1_created.networkCode).toBe(TEST_NETWORKS.network1.networkCode);
  expect(net1_created.networkName).toBe(TEST_NETWORKS.network1.networkName);
  expect(net1_created.networkDescription).toBe(
    TEST_NETWORKS.network1.networkDescription
  );
  const net2_created = await networkRepo.createNetwork(
    TEST_NETWORKS.network2.networkCode,
    TEST_NETWORKS.network2.networkName,
    TEST_NETWORKS.network2.networkDescription
  );
  expect(net2_created).toBeDefined();
  expect(net2_created.networkCode).toBe(TEST_NETWORKS.network2.networkCode);
  expect(net2_created.networkName).toBe(TEST_NETWORKS.network2.networkName);
  expect(net2_created.networkDescription).toBe(
    TEST_NETWORKS.network2.networkDescription
  );

  const net3_created = await networkRepo.createNetwork(
    TEST_NETWORKS.network3.networkCode
  );
  expect(net3_created).toBeDefined();
  expect(net3_created.networkCode).toBe(TEST_NETWORKS.network3.networkCode);
  

  //Create the 4 gateways
  const gatewayRepo = new GatewayRepository();
  const gw1net1_created = await gatewayRepo.createGateway(
    TEST_GATEWAYS.gateway1_Net1.networkCode,
    TEST_GATEWAYS.gateway1_Net1.gatewayMac
  );
  expect(gw1net1_created).toBeDefined();
  expect(gw1net1_created.gatewayMac).toBe(TEST_GATEWAYS.gateway1_Net1.gatewayMac);
 

  const gw2net1_created = await gatewayRepo.createGateway(
    TEST_GATEWAYS.gateway2_Net1.networkCode,
    TEST_GATEWAYS.gateway2_Net1.gatewayMac,
    TEST_GATEWAYS.gateway2_Net1.gatewayName,
    TEST_GATEWAYS.gateway2_Net1.gatewayDescription
  );
  expect(gw2net1_created).toBeDefined();
  expect(gw2net1_created.gatewayMac).toBe(TEST_GATEWAYS.gateway2_Net1.gatewayMac);
  expect(gw2net1_created.gatewayName).toBe(TEST_GATEWAYS.gateway2_Net1.gatewayName);
  expect(gw2net1_created.gatewayDescription).toBe(
    TEST_GATEWAYS.gateway2_Net1.gatewayDescription
  );

  const gw1net2_created = await gatewayRepo.createGateway(
    TEST_GATEWAYS.gateway1_Net2.networkCode,
    TEST_GATEWAYS.gateway1_Net2.gatewayMac,
    TEST_GATEWAYS.gateway1_Net2.gatewayName,
    TEST_GATEWAYS.gateway1_Net2.gatewayDescription
  );
  expect(gw1net2_created).toBeDefined();
  expect(gw1net2_created.gatewayMac).toBe(TEST_GATEWAYS.gateway1_Net2.gatewayMac);
  expect(gw1net2_created.gatewayName).toBe(TEST_GATEWAYS.gateway1_Net2.gatewayName);
  expect(gw1net2_created.gatewayDescription).toBe(
    TEST_GATEWAYS.gateway1_Net2.gatewayDescription
  );

  const gw2net2_created = await gatewayRepo.createGateway(
    TEST_GATEWAYS.gateway2_Net2.networkCode,
    TEST_GATEWAYS.gateway2_Net2.gatewayMac,
    TEST_GATEWAYS.gateway2_Net2.gatewayName,
    TEST_GATEWAYS.gateway2_Net2.gatewayDescription
  );
  expect(gw2net2_created).toBeDefined();
  expect(gw2net2_created.gatewayMac).toBe(TEST_GATEWAYS.gateway2_Net2.gatewayMac);
  expect(gw2net2_created.gatewayName).toBe(TEST_GATEWAYS.gateway2_Net2.gatewayName);
  expect(gw2net2_created.gatewayDescription).toBe(
    TEST_GATEWAYS.gateway2_Net2.gatewayDescription
  );

  //Create the sensors
  const sensorRepo = new SensorRepository();
  const s1gw1net1_created = await sensorRepo.createSensor(
    TEST_SENSORS.sensor1_gateway1_Net1.networkCode,
    TEST_SENSORS.sensor1_gateway1_Net1.gatewayMac,
    TEST_SENSORS.sensor1_gateway1_Net1.sensorMac,
    TEST_SENSORS.sensor1_gateway1_Net1.sensorName,
    TEST_SENSORS.sensor1_gateway1_Net1.sensorDescription,
    TEST_SENSORS.sensor1_gateway1_Net1.sensorVariable,
    TEST_SENSORS.sensor1_gateway1_Net1.sensorUnit
  );
  expect(s1gw1net1_created).toBeDefined();
  expect(s1gw1net1_created.sensorMac).toBe(
    TEST_SENSORS.sensor1_gateway1_Net1.sensorMac
  );
  expect(s1gw1net1_created.sensorName).toBe(
    TEST_SENSORS.sensor1_gateway1_Net1.sensorName
  );
  expect(s1gw1net1_created.sensorDescription).toBe(
    TEST_SENSORS.sensor1_gateway1_Net1.sensorDescription
  );
  expect(s1gw1net1_created.sensorVariable).toBe(
    TEST_SENSORS.sensor1_gateway1_Net1.sensorVariable
  );
  expect(s1gw1net1_created.sensorUnit).toBe(
    TEST_SENSORS.sensor1_gateway1_Net1.sensorUnit
  );
  
  const s2gw1net1_created = await sensorRepo.createSensor(
    TEST_SENSORS.sensor2_gateway1_Net1.networkCode,
    TEST_SENSORS.sensor2_gateway1_Net1.gatewayMac,
    TEST_SENSORS.sensor2_gateway1_Net1.sensorMac,
    TEST_SENSORS.sensor2_gateway1_Net1.sensorName,
    TEST_SENSORS.sensor2_gateway1_Net1.sensorDescription,
    TEST_SENSORS.sensor2_gateway1_Net1.sensorVariable,
    TEST_SENSORS.sensor2_gateway1_Net1.sensorUnit
  );
  expect(s2gw1net1_created).toBeDefined();
  expect(s2gw1net1_created.sensorMac).toBe(
    TEST_SENSORS.sensor2_gateway1_Net1.sensorMac
  );
  expect(s2gw1net1_created.sensorName).toBe(
    TEST_SENSORS.sensor2_gateway1_Net1.sensorName
  );
  expect(s2gw1net1_created.sensorDescription).toBe(
    TEST_SENSORS.sensor2_gateway1_Net1.sensorDescription
  );
  expect(s2gw1net1_created.sensorVariable).toBe(
    TEST_SENSORS.sensor2_gateway1_Net1.sensorVariable
  );
  expect(s2gw1net1_created.sensorUnit).toBe(
    TEST_SENSORS.sensor2_gateway1_Net1.sensorUnit
  );

  const s1gw2net1_created = await sensorRepo.createSensor(
    TEST_SENSORS.sensor1_gateway2_Net1.networkCode,
    TEST_SENSORS.sensor1_gateway2_Net1.gatewayMac,
    TEST_SENSORS.sensor1_gateway2_Net1.sensorMac,
    TEST_SENSORS.sensor1_gateway2_Net1.sensorName,
    TEST_SENSORS.sensor1_gateway2_Net1.sensorDescription,
    TEST_SENSORS.sensor1_gateway2_Net1.sensorVariable,
    TEST_SENSORS.sensor1_gateway2_Net1.sensorUnit
  );
  expect(s1gw2net1_created).toBeDefined();
  expect(s1gw2net1_created.sensorMac).toBe(
    TEST_SENSORS.sensor1_gateway2_Net1.sensorMac
  );
  expect(s1gw2net1_created.sensorName).toBe(
    TEST_SENSORS.sensor1_gateway2_Net1.sensorName
  );
  expect(s1gw2net1_created.sensorDescription).toBe(
    TEST_SENSORS.sensor1_gateway2_Net1.sensorDescription
  );
  expect(s1gw2net1_created.sensorVariable).toBe(
    TEST_SENSORS.sensor1_gateway2_Net1.sensorVariable
  );
  expect(s1gw2net1_created.sensorUnit).toBe(
    TEST_SENSORS.sensor1_gateway2_Net1.sensorUnit
  );

  const s1gw1net2_created = await sensorRepo.createSensor(
    TEST_SENSORS.sensor1_gateway1_Net2.networkCode,
    TEST_SENSORS.sensor1_gateway1_Net2.gatewayMac,
    TEST_SENSORS.sensor1_gateway1_Net2.sensorMac,
    TEST_SENSORS.sensor1_gateway1_Net2.sensorName,
    TEST_SENSORS.sensor1_gateway1_Net2.sensorDescription,
    TEST_SENSORS.sensor1_gateway1_Net2.sensorVariable,
    TEST_SENSORS.sensor1_gateway1_Net2.sensorUnit
  );
  expect(s1gw1net2_created).toBeDefined();
  expect(s1gw1net2_created.sensorMac).toBe(
    TEST_SENSORS.sensor1_gateway1_Net2.sensorMac
  );
  expect(s1gw1net2_created.sensorName).toBe(
    TEST_SENSORS.sensor1_gateway1_Net2.sensorName
  );
  expect(s1gw1net2_created.sensorDescription).toBe(
    TEST_SENSORS.sensor1_gateway1_Net2.sensorDescription
  );
  expect(s1gw1net2_created.sensorVariable).toBe(
    TEST_SENSORS.sensor1_gateway1_Net2.sensorVariable
  );
  expect(s1gw1net2_created.sensorUnit).toBe(
    TEST_SENSORS.sensor1_gateway1_Net2.sensorUnit
  );

  const s2gw1net2_created = await sensorRepo.createSensor(
    TEST_SENSORS.sensor2_gateway1_Net2.networkCode,
    TEST_SENSORS.sensor2_gateway1_Net2.gatewayMac,
    TEST_SENSORS.sensor2_gateway1_Net2.sensorMac,
    TEST_SENSORS.sensor2_gateway1_Net2.sensorName,
    TEST_SENSORS.sensor2_gateway1_Net2.sensorDescription,
    TEST_SENSORS.sensor2_gateway1_Net2.sensorVariable,
    TEST_SENSORS.sensor2_gateway1_Net2.sensorUnit
  );
  expect(s2gw1net2_created).toBeDefined();
  expect(s2gw1net2_created.sensorMac).toBe(
    TEST_SENSORS.sensor2_gateway1_Net2.sensorMac
  );
  expect(s2gw1net2_created.sensorName).toBe(
    TEST_SENSORS.sensor2_gateway1_Net2.sensorName
  );
  expect(s2gw1net2_created.sensorDescription).toBe(
    TEST_SENSORS.sensor2_gateway1_Net2.sensorDescription
  );
  expect(s2gw1net2_created.sensorVariable).toBe(
    TEST_SENSORS.sensor2_gateway1_Net2.sensorVariable
  );
  expect(s2gw1net2_created.sensorUnit).toBe(
    TEST_SENSORS.sensor2_gateway1_Net2.sensorUnit
  );

  const s3_gw1net2_created = await sensorRepo.createSensor(
    TEST_SENSORS.sensor3_gateway1_Net2.networkCode,
    TEST_SENSORS.sensor3_gateway1_Net2.gatewayMac,
    TEST_SENSORS.sensor3_gateway1_Net2.sensorMac,
    TEST_SENSORS.sensor3_gateway1_Net2.sensorName,
    TEST_SENSORS.sensor3_gateway1_Net2.sensorDescription,
    TEST_SENSORS.sensor3_gateway1_Net2.sensorVariable,
    TEST_SENSORS.sensor3_gateway1_Net2.sensorUnit
  );
  expect(s3_gw1net2_created).toBeDefined();
  expect(s3_gw1net2_created.sensorMac).toBe(
    TEST_SENSORS.sensor3_gateway1_Net2.sensorMac
  );
  expect(s3_gw1net2_created.sensorName).toBe(
    TEST_SENSORS.sensor3_gateway1_Net2.sensorName
  );
  expect(s3_gw1net2_created.sensorDescription).toBe(
    TEST_SENSORS.sensor3_gateway1_Net2.sensorDescription
  );
  expect(s3_gw1net2_created.sensorVariable).toBe(
    TEST_SENSORS.sensor3_gateway1_Net2.sensorVariable
  );
  expect(s3_gw1net2_created.sensorUnit).toBe(
    TEST_SENSORS.sensor3_gateway1_Net2.sensorUnit
  );

  const measurementRepo = new MeasurementRepository();

  //Create the measurements
  const m1_s1gw1net1_created = await measurementRepo.createMeasurement(
    TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.networkCode,
    TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.gatewatMac,
    TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.sensorMac,
    TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.createdAt,
    TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.value
  );
  expect(m1_s1gw1net1_created).toBeDefined();
  expect(m1_s1gw1net1_created.createdAt).toEqual(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.createdAt);
  expect(m1_s1gw1net1_created.value).toBe(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net1.value);

  const m2_s1gw1net1_created = await measurementRepo.createMeasurement(
    TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.networkCode,
    TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.gatewatMac,
    TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.sensorMac,
    TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.createdAt,
    TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.value
  );
  expect(m2_s1gw1net1_created).toBeDefined();
  expect(m2_s1gw1net1_created.createdAt).toEqual(TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.createdAt);
  expect(m2_s1gw1net1_created.value).toBe(TEST_MEASUREMENTS.measurement2_sensor1_gateway1_Net1.value);

  const m3_s1gw1net1_created = await measurementRepo.createMeasurement(
    TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.networkCode,
    TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.gatewatMac,
    TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.sensorMac,
    TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.createdAt,
    TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.value
  );
  expect(m3_s1gw1net1_created).toBeDefined();
  expect(m3_s1gw1net1_created.createdAt).toEqual(TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.createdAt);
  expect(m3_s1gw1net1_created.value).toBe(TEST_MEASUREMENTS.measurement3_sensor1_gateway1_Net1.value);

  const m1_s2gw1net1_created = await measurementRepo.createMeasurement(
    TEST_MEASUREMENTS.measurement1_sensor2_gateway1_Net1.networkCode,
    TEST_MEASUREMENTS.measurement1_sensor2_gateway1_Net1.gatewatMac,
    TEST_MEASUREMENTS.measurement1_sensor2_gateway1_Net1.sensorMac,
    TEST_MEASUREMENTS.measurement1_sensor2_gateway1_Net1.createdAt,
    TEST_MEASUREMENTS.measurement1_sensor2_gateway1_Net1.value
  );
  expect(m1_s2gw1net1_created).toBeDefined();
  expect(m1_s2gw1net1_created.createdAt).toEqual(TEST_MEASUREMENTS.measurement1_sensor2_gateway1_Net1.createdAt);
  expect(m1_s2gw1net1_created.value).toBe(TEST_MEASUREMENTS.measurement1_sensor2_gateway1_Net1.value);

  const m1_s1gw1net2_created = await measurementRepo.createMeasurement(
    TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net2.networkCode,
    TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net2.gatewatMac,
    TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net2.sensorMac,
    TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net2.createdAt,
    TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net2.value
  );
  expect(m1_s1gw1net2_created).toBeDefined();
  expect(m1_s1gw1net2_created.createdAt).toEqual(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net2.createdAt);
  expect(m1_s1gw1net2_created.value).toBe(TEST_MEASUREMENTS.measurement1_sensor1_gateway1_Net2.value);
}
export async function afterAllE2e() {
  await closeTestDataSource();
}

