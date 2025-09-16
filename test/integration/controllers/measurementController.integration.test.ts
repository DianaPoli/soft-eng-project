/**
 * measurementController.integration.test.ts
 * Creation date: 2025-05-19
 * Last revision date: 2025-05-20
 * SWE Group 54
 */

import * as measurementController from "@controllers/measurementController";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { Measurements as MeasurementsDTO } from "@dto/Measurements";
import { Stats } from "@models/dto/Stats";
import { Measurement, Measurements, Stats as StatsDTO } from '@dto/index';
import { MeasurementRepository, NetworkRepository, SensorRepository  } from "@repositories/index";
import { SensorDAO } from "@models/dao";
import { TEST_MEASUREMENTS, TEST_SENSORS } from "@test/e2e/lifecycle";

// Mock the MeasurementRepository
jest.mock("@repositories/MeasurementRepository");
jest.mock("@repositories/NetworkRepository");
jest.mock("@repositories/SensorRepository");

describe("MeasurementController integration", () => {

  it("getMeasurementsByNetwork - no sensors", async () => {
    const mockGet = jest.fn().mockResolvedValue([]);
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsByNetworkAndSensors: mockGet
    }));
    const mockNetworkFunction = jest.fn().mockResolvedValue(Promise.resolve()); //network exists
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      findNetworkOrThrow: mockNetworkFunction 
    }));
    const mockSensorFunction = jest.fn().mockResolvedValue([]); //no sensors in the network
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsInNetwork: mockSensorFunction
    }));

    const result = await measurementController.getMeasurementsByNetwork(
      "net1",
      false
      //all the other fields are optional and not used in this test
    );

    expect(mockGet).not.toHaveBeenCalled(); //since there are no sensors, the repo should not be called
    expect(mockNetworkFunction).toHaveBeenCalledWith("net1");
    expect(mockSensorFunction).toHaveBeenCalledWith("net1", undefined);
    expect(result).toBeDefined();
    expect(result).toHaveLength(0);
  });

    it("getMeasurementsByNetwork - no sensors - undefined", async () => {
    const mockGet = jest.fn().mockResolvedValue([]);
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsByNetworkAndSensors: mockGet
    }));
    const mockNetworkFunction = jest.fn().mockResolvedValue(Promise.resolve()); //network exists
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      findNetworkOrThrow: mockNetworkFunction 
    }));
    const mockSensorFunction = jest.fn().mockResolvedValue([]); //no sensors in the network
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsInNetwork: mockSensorFunction
    }));

    const result = await measurementController.getMeasurementsByNetwork(
      "net1",
      undefined,
      [],
      undefined,
      undefined
    );

    expect(mockGet).not.toHaveBeenCalled(); //since there are no sensors, the repo should not be called
    expect(mockNetworkFunction).toHaveBeenCalledWith("net1");
    expect(mockSensorFunction).toHaveBeenCalledWith("net1", []);
    expect(result).toBeDefined();
    expect(result).toHaveLength(0);
    });
  
    it("getMeasurementsByNetwork - some invalid sensors - multiple measurements", async () => {
      const date1 = new Date("2025-05-15T08:00:00.000Z");
      const date2 = new Date("2025-05-15T09:00:00.000Z");
  
      const fakeSensor: SensorDAO = {
        sensorMac: "00:00:00:00:00:01",
        sensorName: "Sensor A",
        sensorDescription: "Description A",
        sensorVariable: "Temperature",
        sensorUnit: "Celsius",
        gateway: null, //not eagerly loaded
        measurements: []
      }
  
      const fakeMeasurement0: MeasurementDAO = {
        id: 1,
        createdAt: date1,
        value: 10,
        sensor: fakeSensor
      };
  
      const fakeMeasurement1: MeasurementDAO = {
        id: 2,
        createdAt: date2,
        value: 20,
        sensor: fakeSensor
      };
  
      //add the measurements to the sensor
      fakeSensor.measurements.push(fakeMeasurement0);
      fakeSensor.measurements.push(fakeMeasurement1);

      const mockGet = jest.fn().mockResolvedValue([fakeMeasurement0, fakeMeasurement1]);
      
      (MeasurementRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsByNetworkAndSensors: mockGet
      }));
      const mockNetworkFunction = jest.fn().mockResolvedValue(Promise.resolve()); //network exists
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        findNetworkOrThrow: mockNetworkFunction 
      }));
      const mockSensorFunction = jest.fn().mockResolvedValue([fakeSensor.sensorMac]); //some sensors are in the network
      (SensorRepository as jest.Mock).mockImplementation(() => ({
        getSensorMacsInNetwork: mockSensorFunction
      }));
  
      const result = await measurementController.getMeasurementsByNetwork(
        "net1",
        false,
        ["sensorA", "sensorB", "sensorC", fakeSensor.sensorMac], //some of these sensors are not in the network
        //all the other fields are optional and not used in this test
      );

      console.log(result);
      const computedMean: number = (fakeMeasurement0.value + fakeMeasurement1.value) / 2;
      const computedVariance: number = (Math.pow(fakeMeasurement0.value - computedMean, 2) + Math.pow(fakeMeasurement1.value - computedMean, 2)) / 2;
      
      expect(mockGet).toHaveBeenCalledWith("net1", [fakeSensor.sensorMac], undefined, undefined);
      expect(mockNetworkFunction).toHaveBeenCalledWith("net1");
      expect(mockSensorFunction).toHaveBeenCalledWith("net1", ["sensorA", "sensorB", "sensorC", fakeSensor.sensorMac]);
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].sensorMacAddress).toEqual(fakeSensor.sensorMac);
      expect(result[0]).toBeDefined();
      expect(result[0].stats).toBeDefined();
      expect(result[0].measurements).toBeDefined();
      expect(result[0].measurements).toHaveLength(2);
      expect(result[0].measurements[0].createdAt).toEqual(date1);
      expect(result[0].measurements[0].value).toEqual(10);
      expect(result[0].measurements[0].isOutlier).toEqual(false); //since we are not filtering out outliers
      expect(result[0].measurements[1].createdAt).toEqual(date2);
      expect(result[0].measurements[1].value).toEqual(20);
      expect(result[0].measurements[1].isOutlier).toEqual(false); //since we are not filtering out outliers
      expect(result[0].stats.mean).toEqual(computedMean);
      expect(result[0].stats.variance).toEqual(computedVariance);
      expect(result[0].stats.lowerThreshold).toBeCloseTo(computedMean - 2 * Math.sqrt(computedVariance));
      expect(result[0].stats.upperThreshold).toBeCloseTo(computedMean + 2 * Math.sqrt(computedVariance));
    });
  
    it("getMeasurementsByNetwork - some invalid sensors - no measurements", async () => {
      const date1 = new Date("2025-05-15T08:00:00.000Z");
      const date2 = new Date("2025-05-15T09:00:00.000Z");
  
      const fakeSensor1: SensorDAO = {
        sensorMac: "00:00:00:00:00:01",
        sensorName: "Sensor A",
        sensorDescription: "Description A",
        sensorVariable: "Temperature",
        sensorUnit: "Celsius",
        gateway: null, //not eagerly loaded
        measurements: []
      }

      const fakeSensor2: SensorDAO = {
        sensorMac: "00:00:00:00:00:02",
        sensorName: "Sensor B",
        sensorDescription: "Description B",
        sensorVariable: "Temperature",
        sensorUnit: "Celsius",
        gateway: null, //not eagerly loaded
        measurements: []
      }

      const mockGet = jest.fn().mockResolvedValue([]);
      
      (MeasurementRepository as jest.Mock).mockImplementation(() => ({
        getMeasurementsByNetworkAndSensors: mockGet
      }));
      const mockNetworkFunction = jest.fn().mockResolvedValue(Promise.resolve()); //network exists
      (NetworkRepository as jest.Mock).mockImplementation(() => ({
        findNetworkOrThrow: mockNetworkFunction 
      }));
      const mockSensorFunction = jest.fn().mockResolvedValue([fakeSensor1.sensorMac, fakeSensor2.sensorMac]); //some sensors are in the network
      (SensorRepository as jest.Mock).mockImplementation(() => ({
        getSensorMacsInNetwork: mockSensorFunction
      }));
  
      const result = await measurementController.getMeasurementsByNetwork(
        "net1",
        false,
        ["sensorA", "sensorB", "sensorC", fakeSensor1.sensorMac, fakeSensor2.sensorMac], //some of these sensors are not in the network
        //all the other fields are optional and not used in this test
      );

      console.log(result);
      
      expect(mockGet).toHaveBeenCalledWith("net1", [fakeSensor1.sensorMac, fakeSensor2.sensorMac], undefined, undefined);
      expect(mockNetworkFunction).toHaveBeenCalledWith("net1");
      expect(mockSensorFunction).toHaveBeenCalledWith("net1", ["sensorA", "sensorB", "sensorC", fakeSensor1.sensorMac, fakeSensor2.sensorMac]);
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeDefined();
      expect(result[0].sensorMacAddress).toEqual(fakeSensor1.sensorMac);
      expect(result[1]).toBeDefined();
      expect(result[1].sensorMacAddress).toEqual(fakeSensor2.sensorMac);
    
    });
  
  

  it("getMeasurementsByNetwork - with multiple measurements", async () => {
    const date1 = new Date("2025-05-15T08:00:00.000Z");
    const date2 = new Date("2025-05-15T09:00:00.000Z");

    const fakeSensor: SensorDAO = {
      sensorMac: "00:00:00:00:00:01",
      sensorName: "Sensor A",
      sensorDescription: "Description A",
      sensorVariable: "Temperature",
      sensorUnit: "Celsius",
      gateway: null, //not eagerly loaded
      measurements: []
    }

    const fakeMeasurement0: MeasurementDAO = {
      id: 1,
      createdAt: date1,
      value: 10,
      sensor: fakeSensor
    };

    const fakeMeasurement1: MeasurementDAO = {
      id: 2,
      createdAt: date2,
      value: 20,
      sensor: fakeSensor
    };

    //add the measurements to the sensor
    fakeSensor.measurements.push(fakeMeasurement0);
    fakeSensor.measurements.push(fakeMeasurement1);

    const mockGet = jest.fn().mockResolvedValue([fakeMeasurement0, fakeMeasurement1]);
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsByNetworkAndSensors: mockGet
    }));
    const mockNetworkFunction = jest.fn().mockResolvedValue(Promise.resolve()); //network exists
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      findNetworkOrThrow: mockNetworkFunction 
    }));
    const mockSensorFunction = jest.fn().mockResolvedValue([fakeSensor.sensorMac]); //no sensors in the network
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsInNetwork: mockSensorFunction
    }));

    const result = await measurementController.getMeasurementsByNetwork(
      "net1",
      false,
      [fakeSensor.sensorMac],
      date1,
      date2
    );

    expect(mockGet).toHaveBeenCalledWith("net1", [fakeSensor.sensorMac], date1, date2);
    expect(result).toHaveLength(1);

    const computedMean: number = (fakeMeasurement0.value + fakeMeasurement1.value) / 2;
    const computedVariance: number = (Math.pow(fakeMeasurement0.value - computedMean, 2) + Math.pow(fakeMeasurement1.value - computedMean, 2)) / 2;
    const group = result[0];
    //the measurementsDTO need to have these keys: sensorMacAddress, stats, measurements
    expect(group).toHaveProperty("sensorMacAddress");
    expect(group).toHaveProperty("stats");
    expect(group).toHaveProperty("measurements");
    expect(group.sensorMacAddress).toEqual(fakeSensor.sensorMac);
    expect(group.measurements).toHaveLength(2);
    expect(group.measurements[0].createdAt).toEqual(date1);
    expect(group.measurements[0].value).toEqual(10);
    expect(group.measurements[0].isOutlier).toEqual(false); //since we are not filtering out outliers
    expect(group.measurements[1].createdAt).toEqual(date2);
    expect(group.measurements[1].value).toEqual(20);
    expect(group.measurements[1].isOutlier).toEqual(false); //since we are not filtering out outliers

    const stats = group.stats;
    expect(stats.mean).toEqual(computedMean);
    expect(stats.variance).toEqual(computedVariance);
    expect(stats.lowerThreshold).toBeCloseTo(computedMean - 2 * Math.sqrt(computedVariance));
    expect(stats.upperThreshold).toBeCloseTo(computedMean + 2 * Math.sqrt(computedVariance));
  });

  it("getMeasurementsByNetwork - filters out non-outliers when onlyOutliers=true", async () => {

    const fakeSensor: SensorDAO = {
      sensorMac: "00:00:00:00:00:01",
      sensorName: "Sensor A",
      sensorDescription: "Description A",
      sensorVariable: "Temperature",
      sensorUnit: "Celsius",
      gateway: null, //not eagerly loaded
      measurements: []
    }


    const date = new Date("2025-05-20T00:00:00.000Z");
    const normal: MeasurementDAO = {
      id: 1,
      createdAt: date,
      value: 10,
      sensor: fakeSensor
    };
    const outlier: MeasurementDAO = {
      id: 2,
      createdAt: date,
      value: 999,
      sensor: fakeSensor
    };

    //add the measurements to the sensor
    fakeSensor.measurements.push(normal);
    fakeSensor.measurements.push(outlier);

    const mockGet = jest.fn().mockResolvedValue([normal, outlier]);
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsByNetworkAndSensors: mockGet
    }));
    const mockNetworkFunction = jest.fn().mockResolvedValue(Promise.resolve()); //network exists
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      findNetworkOrThrow: mockNetworkFunction 
    }));
    const mockSensorFunction = jest.fn().mockResolvedValue([fakeSensor.sensorMac]); //no sensors in the network
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsInNetwork: mockSensorFunction
    }));

    const result = await measurementController.getMeasurementsByNetwork(
      "netX",
      true, //only outliers
      [fakeSensor.sensorMac],
      date,
      date
    );

    expect(mockGet).toHaveBeenCalledWith("netX", [fakeSensor.sensorMac], date, date);
    console.log(result);
    // controller still returns the sensor group, but with filtered measurements
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("sensorMacAddress");
    expect(result[0]).toHaveProperty("stats");
    expect(result[0]).toHaveProperty("measurements");
    expect(result[0].measurements).toHaveLength(0);
    //check that the stats are still correct
    const computedMean: number = (normal.value + outlier.value) / 2;
    const computedVariance: number = (Math.pow(normal.value - computedMean, 2) + Math.pow(outlier.value - computedMean, 2)) / 2;
    expect(result[0].stats.mean).toBeCloseTo(computedMean); 
    expect(result[0].stats.variance).toBeCloseTo(computedVariance);
    expect(result[0].stats.lowerThreshold).toBeCloseTo(computedMean - 2 * Math.sqrt(computedVariance));
    expect(result[0].stats.upperThreshold).toBeCloseTo(computedMean + 2 * Math.sqrt(computedVariance));
    expect(result[0].sensorMacAddress).toEqual(fakeSensor.sensorMac);

  });

  it("getStatsbyNetwork - no stats", async () => {
    const mockGet = jest.fn().mockResolvedValue([]);
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsByNetworkAndSensors: mockGet
    }));

    //mock the network and sensor repositories to return valid data
    const mockNetworkFunction = jest.fn().mockResolvedValue(Promise.resolve()); //network exists
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      findNetworkOrThrow: mockNetworkFunction 
    }));

    //assuje the network has no sensors
    //so, no measurements will be returned -> empty array 
    const mockSensorFunction = jest.fn().mockResolvedValue([]); //no sensors in the network
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsInNetwork: mockSensorFunction
    }));

    const result = await measurementController.getStatsbyNetwork(
      "net1",
      [],
      undefined,
      undefined
    );

    expect(result).toEqual([]); //empty array of Measurements
    expect(mockGet).not.toHaveBeenCalled(); //since there are no sensors, the repo should not be called
  });

  it("getStatsbyNetwork - with stats for one sensor", async () => {
    const fakeSensor: SensorDAO = {
      sensorMac: "00:00:00:00:00:01",
      sensorName: "Sensor A",
      sensorDescription: "Description A",
      sensorVariable: "Temperature",
      sensorUnit: "Celsius",
      gateway: null, //not eagerly loaded
      measurements: []
    }

    const date1 = new Date("2025-05-15T10:00:00.000Z");
    const fakeDAO: MeasurementDAO = {
      id: 1,
      createdAt: date1,
      value: 5,
      sensor: fakeSensor  
    };
    fakeSensor.measurements.push(fakeDAO);

    const mockGet = jest.fn().mockResolvedValue([fakeDAO]);
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsByNetworkAndSensors: mockGet
    }));

    //valid sensor mac is 1
    const mockSensorFunction = jest.fn().mockResolvedValue([fakeSensor.sensorMac]); //network has this sensor
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsInNetwork: mockSensorFunction
    }));

    const mockNetworkFunction = jest.fn().mockResolvedValue(Promise.resolve()); //network exists
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      findNetworkOrThrow: mockNetworkFunction 
    }));

    const result = await measurementController.getStatsbyNetwork(
      "net1",
      ["sensorB"],
      date1,
      date1
    );

    expect(result).toHaveLength(1);
    const measurements: Measurements = result[0];
    const stats: Stats = measurements.stats;
    expect(stats.mean).toEqual(5);
    expect(stats.variance).toEqual(0); //always 0 for less than 2 measurements
    expect(stats.lowerThreshold).toEqual(5);
    expect(stats.upperThreshold).toEqual(5);
  });

  it("getMeasurementsBySensor - no measurements", async () => {
    const mockGet = jest.fn().mockResolvedValue([]);
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsBySensor: mockGet
    }));

    //mock the network and sensor repositories to return valid data
    const mockNetworkFunction = jest.fn().mockResolvedValue(Promise.resolve()); //network exists
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      findNetworkOrThrow: mockNetworkFunction 
    }));

    //assuje the network has no sensors
    //so, no measurements will be returned -> empty array 
    const mockSensorFunction = jest.fn().mockResolvedValue([]); //no sensors in the network
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsInNetwork: mockSensorFunction
    }));

    //the return value is an empty array, since there are no measurements

    const result = await measurementController.getMeasurementsBySensor(
      "sensorX",
      "gwX",
      "netX",
      false,
      undefined,
      undefined
    );

    //result is just {"sensorMacAddress": "sensorX"}
    expect(result).toBeDefined();
    expect(result).toHaveProperty("sensorMacAddress");
    expect(result.sensorMacAddress).toEqual("sensorX");
    expect(result).not.toHaveProperty("measurements"); //no measurements, so this property should not exist
    expect(result).not.toHaveProperty("stats"); //no stats, so this property should not exist
    expect(mockGet).toHaveBeenCalledWith("netX", "gwX", "sensorX", undefined, undefined);
  });

  it("getMeasurementsBySensor - returns measurements when onlyOutliers=false", async () => {
    const fakeSensor: SensorDAO = {
      sensorMac: "00:00:00:00:00:01",
      sensorName: "Sensor A",
      sensorDescription: "Description A",
      sensorVariable: "Temperature",
      sensorUnit: "Celsius",
      gateway: null, //not eagerly loaded
      measurements: []
    }
    const date1 = new Date("2025-05-16T12:00:00.000Z");
    const dao1: MeasurementDAO = {
      id: 1,
      createdAt: date1,
      value: 100,
      sensor: fakeSensor
    };
    const dao2: MeasurementDAO = {
      id: 2,
      createdAt: date1,
      value: 200,
      sensor: fakeSensor
    };
    fakeSensor.measurements.push(dao1);
    fakeSensor.measurements.push(dao2);

    const mockGet = jest.fn().mockResolvedValue([dao1, dao2]);
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsBySensor: mockGet
    }));

    const result = await measurementController.getMeasurementsBySensor(
      fakeSensor.sensorMac,
      "gwY",
      "netY",
      false,
      date1,
      date1
    );

    expect(result.measurements).toHaveLength(2);
    expect(result.measurements.map(m => m.value)).toEqual([100, 200]);
  });

  it("getMeasurementsBySensor - filters out non-outliers when onlyOutliers=true", async () => {
    const fakeSensor: SensorDAO = {
      sensorMac: "00:00:00:00:00:01",
      sensorName: "Sensor A",
      sensorDescription: "Description A",
      sensorVariable: "Temperature",
      sensorUnit: "Celsius",
      gateway: null, //not eagerly loaded
      measurements: []
    }
    const date1 = new Date("2025-05-16T12:00:00.000Z");
    const dao: MeasurementDAO = {
      id: 1,
      createdAt: date1,
      value: 100,
      sensor: fakeSensor
    };
    fakeSensor.measurements.push(dao);
    

    const mockGet = jest.fn().mockResolvedValue([dao]);
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsBySensor: mockGet
    }));

    const result = await measurementController.getMeasurementsBySensor(
      "sensorY",
      "gwY",
      "netY",
      true,
      date1,
      date1
    );

    expect(result.measurements).toHaveLength(0);
  });


  it("getMeasurementsBySensor - returns measurements when onlyOutliers= undefined", async () => {
    const fakeSensor: SensorDAO = {
      sensorMac: "00:00:00:00:00:01",
      sensorName: "Sensor A",
      sensorDescription: "Description A",
      sensorVariable: "Temperature",
      sensorUnit: "Celsius",
      gateway: null, //not eagerly loaded
      measurements: []
    }
    const date1 = new Date("2025-05-16T12:00:00.000Z");
    const dao1: MeasurementDAO = {
      id: 1,
      createdAt: date1,
      value: 100,
      sensor: fakeSensor
    };
    const dao2: MeasurementDAO = {
      id: 2,
      createdAt: date1,
      value: 200,
      sensor: fakeSensor
    };
    fakeSensor.measurements.push(dao1);
    fakeSensor.measurements.push(dao2);

    const mockGet = jest.fn().mockResolvedValue([dao1, dao2]);
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsBySensor: mockGet
    }));

    const result = await measurementController.getMeasurementsBySensor(
      "sensorY",
      "gwY",
      "netY",
      undefined,
      date1,
      date1
    );

    expect(result.measurements).toHaveLength(2);
    expect(result.measurements.map(m => m.value)).toEqual([100, 200]);
  });

  it("getMeasurementsBySensor - test just endDate", async () => {
    const fakeSensor: SensorDAO = {
      sensorMac: "00:00:00:00:00:01",
      sensorName: "Sensor A",
      sensorDescription: "Description A",
      sensorVariable: "Temperature",
      sensorUnit: "Celsius",
      gateway: null, //not eagerly loaded
      measurements: []
    }

    const date1 = new Date("2025-05-16T12:00:00.000Z");
    const dao1: MeasurementDAO = {
      id: 1,
      createdAt: date1,
      value: 100,
      sensor: fakeSensor
    };

    const date2 = new Date("2025-05-16T13:00:00.000Z");
    const dao2: MeasurementDAO = {
      id: 2,
      createdAt: date2,
      value: 200,
      sensor: fakeSensor
    };
    fakeSensor.measurements.push(dao1);
    fakeSensor.measurements.push(dao2);

    const endDate = new Date("2025-06-16T14:00:00.000Z"); //this way both measurements are included

    const mockGet = jest.fn().mockResolvedValue([dao1, dao2]);
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsBySensor: mockGet
    }));

    const result = await measurementController.getMeasurementsBySensor(
      "sensorY",
      "gwY",
      "netY",
      undefined,
      undefined,
      endDate
    );

    expect(result.measurements).toHaveLength(2);
    expect(result.measurements.map(m => m.value)).toEqual([100, 200]);
    expect(result.measurements[0].createdAt).toEqual(date1);
    expect(result.measurements[1].createdAt).toEqual(date2);
    expect(result.measurements[0].isOutlier).toEqual(false);
    expect(result.measurements[1].isOutlier).toEqual(false);
  });

  it("getMeasurementsBySensor - test just startDate, after measurements", async () => {
    const fakeSensor: SensorDAO = {
      sensorMac: "00:00:00:00:00:01",
      sensorName: "Sensor A",
      sensorDescription: "Description A",
      sensorVariable: "Temperature",
      sensorUnit: "Celsius",
      gateway: null, //not eagerly loaded
      measurements: []
    }

    const date1 = new Date("2025-05-16T12:00:00.000Z");
    const dao1: MeasurementDAO = {
      id: 1,
      createdAt: date1,
      value: 100,
      sensor: fakeSensor
    };

    const date2 = new Date("2025-05-16T13:00:00.000Z");
    const dao2: MeasurementDAO = {
      id: 2,
      createdAt: date2,
      value: 200,
      sensor: fakeSensor
    };
    fakeSensor.measurements.push(dao1);
    fakeSensor.measurements.push(dao2);

    const startDate = new Date("2025-06-17T14:00:00.000Z"); //this way both measurements are excluded

    const mockGet = jest.fn().mockResolvedValue([]); //simulate the repo filters out the measurements because of the startDate
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsBySensor: mockGet
    }));

    const result = await measurementController.getMeasurementsBySensor(
      "sensorY",
      "gwY",
      "netY",
      undefined,
      startDate,
      undefined
    );

    //since, because of the startDate, no measurements are included
    //we will receive just: { sensorMacAddress: 'sensorY' }
    expect(result).toBeDefined();
    expect(result.sensorMacAddress).toEqual("sensorY");
    expect(result).not.toHaveProperty("measurements"); 
  });

  it("getMeasurementsBySensor - test just startDate, before measurements", async () => {
    const fakeSensor: SensorDAO = {
      sensorMac: "00:00:00:00:00:01",
      sensorName: "Sensor A",
      sensorDescription: "Description A",
      sensorVariable: "Temperature",
      sensorUnit: "Celsius",
      gateway: null, //not eagerly loaded
      measurements: []
    }

    const date1 = new Date("2025-05-16T12:00:00.000Z");
    const dao1: MeasurementDAO = {
      id: 1,
      createdAt: date1,
      value: 100,
      sensor: fakeSensor
    };

    const date2 = new Date("2025-05-16T13:00:00.000Z");
    const dao2: MeasurementDAO = {
      id: 2,
      createdAt: date2,
      value: 200,
      sensor: fakeSensor
    };
    fakeSensor.measurements.push(dao1);
    fakeSensor.measurements.push(dao2);

    const startDate = new Date("2025-05-15T14:00:00.000Z"); //this way both measurements are included

    const mockGet = jest.fn().mockResolvedValue([dao1, dao2]);
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsBySensor: mockGet
    }));

    const result = await measurementController.getMeasurementsBySensor(
      "sensorY",
      "gwY",
      "netY",
      undefined,
      startDate,
      undefined
    );

    expect(result.measurements).toHaveLength(2);
    expect(result.measurements.map(m => m.value)).toEqual([100, 200]);
  });

  it("getMeasurementsBySensor - both dates are undefined", async () => {
    const fakeSensor: SensorDAO = {
      sensorMac: "00:00:00:00:00:01",
      sensorName: "Sensor A",
      sensorDescription: "Description A",
      sensorVariable: "Temperature",
      sensorUnit: "Celsius",
      gateway: null, //not eagerly loaded
      measurements: []
    }

    //simulate two measurements very far apart in time
    //but since no dates are provided, they both should be fetched
    const date1 = new Date("2025-05-17T14:00:00.000Z");
    const fakeDAO0: MeasurementDAO = {
      id: 1,
      createdAt: date1,
      value: 50,
      sensor: fakeSensor
    };
    const date2 = new Date("2014-05-17T15:00:00.000Z"); 
    const fakeDAO1: MeasurementDAO = {
      id: 2,
      createdAt: date2,
      value: 75,
      sensor: fakeSensor
    };
    fakeSensor.measurements.push(fakeDAO0);
    fakeSensor.measurements.push(fakeDAO1);

    const mockGet = jest.fn().mockResolvedValue([fakeDAO0, fakeDAO1]); //no dates provided, so both measurements should be fetched
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsBySensor: mockGet
    }));

    const result = await measurementController.getMeasurementsBySensor(
      "sensorW",
      "gwW",
      "netW",
      false
      //both dates are undefined
    );

    expect(result.measurements).toHaveLength(2);
    expect(result.measurements.map(m => m.value)).toEqual([50, 75]);
  });

  it("GetMeasurementsBySensor - outliers fine-grained checks", async () => {
    const fakeSensor: SensorDAO = {
      sensorMac: "00:00:00:00:00:01",
      sensorName: "Sensor A",
      sensorDescription: "Description A",
      sensorVariable: "Temperature",
      sensorUnit: "Celsius",
      gateway: null, //not eagerly loaded
      measurements: []
    }
    const date1 = new Date("2025-05-16T12:00:00.000Z");
    const dao1: MeasurementDAO = {
      id: 1,
      createdAt: date1,
      value: 100,
      sensor: fakeSensor
    };
    const dao2: MeasurementDAO = {
      id: 2,
      createdAt: date1,
      value: 200,
      sensor: fakeSensor
    };
    const dao3: MeasurementDAO = {
      id: 3,
      createdAt: date1,
      value: 300,
      sensor: fakeSensor
    };
    fakeSensor.measurements.push(dao1);
    fakeSensor.measurements.push(dao2);
    fakeSensor.measurements.push(dao3);
    const mockGet = jest.fn().mockResolvedValue([dao1, dao2, dao3]);
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsBySensor: mockGet
    }));

    const result = await measurementController.getMeasurementsBySensor(
      "sensorY",
      "gwY",
      "netY",
      true,
      date1,
      date1
    );
    expect(result.measurements).toHaveLength(0);


    //now test with onlyOutliers = false but not call it in the function
    const result2 = await measurementController.getMeasurementsBySensor(
      "sensorY",
      "gwY",
      "netY",
      undefined,
      date1,
      date1
    );
    expect(result2.measurements).toHaveLength(3);
    expect(result2.measurements[0].value).toEqual(100);
    expect(result2.measurements[1].value).toEqual(200);
    expect(result2.measurements[2].value).toEqual(300);
  });

  it("getStatsBySensor - no stats", async () => {
    const mockGet = jest.fn().mockResolvedValue([]);
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsBySensor: mockGet
    }));

    const result = await measurementController.getStatsBySensor(
      "sensorZ",
      "gwZ",
      "netZ",
      undefined,
      undefined
    );

    expect(mockGet).toHaveBeenCalledWith("netZ", "gwZ", "sensorZ", undefined, undefined);
    expect(result).toBeDefined();
    //const measurements: MeasurementsDTO = result;
    //expect(measurements.sensorMacAddress).toEqual("sensorZ");
    //const stats: StatsDTO = measurements.stats;
    expect(result.mean).toEqual(0);
    expect(result.variance).toEqual(0);
    expect(result.lowerThreshold).toEqual(0);
    expect(result.upperThreshold).toEqual(0);
  });


  it("getStatsBySensor - both dates are undefined", async () => {
    const fakeSensor: SensorDAO = {
      sensorMac: "00:00:00:00:00:01",
      sensorName: "Sensor A",
      sensorDescription: "Description A",
      sensorVariable: "Temperature",
      sensorUnit: "Celsius",
      gateway: null, //not eagerly loaded
      measurements: []
    }

    //simulate two measurements very far apart in time
    //but since no dates are provided, they both should be fetched
    const date1 = new Date("2025-05-17T14:00:00.000Z");
    const fakeDAO0: MeasurementDAO = {
      id: 1,
      createdAt: date1,
      value: 50,
      sensor: fakeSensor
    };
    const date2 = new Date("2014-05-17T15:00:00.000Z"); 
    const fakeDAO1: MeasurementDAO = {
      id: 2,
      createdAt: date2,
      value: 75,
      sensor: fakeSensor
    };
    fakeSensor.measurements.push(fakeDAO0);
    fakeSensor.measurements.push(fakeDAO1);

    const mockGet = jest.fn().mockResolvedValue([fakeDAO0, fakeDAO1]); //no dates provided, so both measurements should be fetched
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsBySensor: mockGet
    }));

    const result = await measurementController.getStatsBySensor(
      fakeSensor.sensorMac,
      "gwW",
      "netW"
      //both dates are undefined
    );

    const computedMean = (fakeDAO0.value + fakeDAO1.value) / 2;
    const computedVariance = ((fakeDAO0.value - computedMean) ** 2 + (fakeDAO1.value - computedMean) ** 2) / 2;
    //const measurements: MeasurementsDTO = resultF;
    //expect(measurements.sensorMacAddress).toEqual(fakeSensor.sensorMac);
    //const stats: StatsDTO = measurements.stats;
    expect(result.mean).toEqual(computedMean);
    expect(result.variance).toEqual(computedVariance);
    expect(result.lowerThreshold).toEqual(computedMean - 2 * Math.sqrt(computedVariance));
    expect(result.upperThreshold).toEqual(computedMean + 2 * Math.sqrt(computedVariance));
  });

  it("getStatsBySensor - with one measurement", async () => {
    const fakeSensor: SensorDAO = {
      sensorMac: "00:00:00:00:00:01",
      sensorName: "Sensor A",
      sensorDescription: "Description A",
      sensorVariable: "Temperature",
      sensorUnit: "Celsius",
      gateway: null, //not eagerly loaded
      measurements: []
    }
    const date1 = new Date("2025-05-17T14:00:00.000Z");
    const fakeDAO: MeasurementDAO = {
      id: 1,
      createdAt: date1,
      value: 50,
      sensor: fakeSensor
    };
    fakeSensor.measurements.push(fakeDAO);

    const mockGet = jest.fn().mockResolvedValue([fakeDAO]);
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsBySensor: mockGet
    }));

    const result = await measurementController.getStatsBySensor(
      fakeSensor.sensorMac,
      "gwW",
      "netW",
      date1,
      date1
    );

    //const measurements: MeasurementsDTO = result;
    //expect(measurements.sensorMacAddress).toEqual(fakeSensor.sensorMac);
    //const stats: StatsDTO = measurements.stats;
    expect(result.mean).toEqual(50);
    expect(result.variance).toEqual(0); //variance is 0 for less than 2 measurements
    expect(result.lowerThreshold).toEqual(50);
    expect(result.upperThreshold).toEqual(50);
  });

  it("storeMeasurement - calls repository correctly", async () => {
    const fakeMeasurement: Measurement = {
      createdAt: new Date("2025-05-18T15:00:00.000Z"),
      value: 75,
      isOutlier: false
    };

    const mockCreate = jest.fn();
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      createMeasurement: mockCreate
    }));

    await measurementController.storeMeasurement(
      "sensorM",
      "gwM",
      "netM",
      fakeMeasurement
    );

    expect(mockCreate).toHaveBeenCalledWith(
      "netM",
      "gwM",
      "sensorM",
      fakeMeasurement.createdAt,
      fakeMeasurement.value
    );
  });

});
