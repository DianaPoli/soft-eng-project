/**
 * measurementController.ts
 * Creation Date: 2025-05-013
 * Last Revision Date: 2025-05-14
 * SWE Group 54
 */
import { Measurements } from "@dto/Measurements";
import { MeasurementRepository, NetworkRepository, SensorRepository } from "@repositories/index";
import { Measurement } from "@dto/Measurement";
import { getStatsDTO, getMeasurementsDTO } from "@services/statsService";
import { MeasurementDAO, NetworkDAO, SensorDAO } from "@dao/index";
import { Stats } from "@models/dto/Stats";

const defaultStats : Stats = {
    mean: 0,
    variance: 0,
    upperThreshold: 0,
    lowerThreshold: 0
}

/**
 * Get measurements and stats for a network
 * @param {string} networkCode - The network code to filter measurements
 * @param {boolean} onlyOutliers - If true, only outliers will be included in the result Default is false
 * @param {string[]} sensorMac - The mac addresses of the sensors to filter measurements. Optional
 * @param {Date} startDate - The start date for filtering measurements. Optional
 * @param {Date} endDate - The end date for filtering measurements. Optional
 * @returns {Promise<Measurements[]>} - An array of Measurements DTO objects
 * @throws {NotFoundError} - If the network is not found, or sensor macs are not found
 */
export async function getMeasurementsByNetwork(networkCode: string, onlyOutliers:boolean = false, sensorMac?: string[], startDate?: Date, endDate?: Date): Promise<Measurements[]> {
    const MeasRepo = new MeasurementRepository();
    const NetRepo = new NetworkRepository();
    const SenRepo = new SensorRepository();

    //first networkCode exists
    await NetRepo.findNetworkOrThrow(networkCode); //throws NotFoundError if not found


    //then select just sensorMac that are valid and belong to the network
    const validSensorMacs: string[] = await SenRepo.getSensorMacsInNetwork(networkCode, sensorMac); 

    //If all the provided MAC addresses are invalid, the response will be an empty array.
    if (validSensorMacs.length === 0) {
        return []; //empty array of Measurements
    }

    //fetch measurements ONLY for these valid and relevant sensor MACs.
    const measurements: MeasurementDAO[] = await MeasRepo.getMeasurementsByNetworkAndSensors(networkCode, validSensorMacs, startDate, endDate); //vec di measDAO
    
    //creating a dict with key: sensorMac and value: related measurements DAOs
    const measurementsBySensor: { [sensorMac: string]: MeasurementDAO[] } = {};
    for (const measurement of measurements) {
        const mac = measurement.sensor.sensorMac; 
        if (!measurementsBySensor[mac]) {
          measurementsBySensor[mac] = [];
        }
        measurementsBySensor[mac].push(measurement);
    }
  

    //ensures every sensor in `validSensorMacs` gets an entry in the response. This entry can be empty of measurements and just have the sensorMac
    const measurementsDTO: Measurements[] = [];
    for (const mac of validSensorMacs) {
      const sensorSpecificData = measurementsBySensor[mac] || [];

      //if onlyOutliers is true, we want to skip the measurements that are not outliers
      //getMeasurementsDTO MUST be able to handle sensorSpecificData being an empty array
      //and correctly return the "minimal DTO" for that 'mac'.
      let measDTO: Measurements;
      if (sensorSpecificData.length === 0) {
        //if we have no measurements, we just return the sensorMac
        measDTO = {
          sensorMacAddress: mac
        }
      } else {
        //if we have measurements, we can get the stats and the measurements
        measDTO = getMeasurementsDTO(
          sensorSpecificData,
          mac,
          onlyOutliers,
          startDate,
          endDate
        );
      }

      measurementsDTO.push(measDTO);
      
    }
  

    return measurementsDTO;  
}

/**
 * Get stats for a network
 * @param {string} networkCode - The network code to filter measurements
 * @param {string[]} sensorMac - The mac addresses of the sensors to filter measurements. Optional
 * @param {Date} startDate - The start date for filtering measurements. Optional
 * @param {Date} endDate - The end date for filtering measurements. Optional
 * @returns {Promise<Measurements[]>} - An array of Measurements DTO objects with just sensorMac and stats (no measurements)
 * @throws {NotFoundError} - If the network is not found, or sensor macs are not found
 */
export async function getStatsbyNetwork(networkCode: string, sensorMac?: string[], startDate?: Date, endDate?: Date): Promise<Measurements[]> {
  const repo = new MeasurementRepository();
  const NetRepo = new NetworkRepository();
  const SenRepo = new SensorRepository();

  //first networkCode exists
  await NetRepo.findNetworkOrThrow(networkCode); //throws NotFoundError if not found


  //then select just sensorMac that are valid and belong to the network
  const validSensorMacs: string[] = await SenRepo.getSensorMacsInNetwork(networkCode, sensorMac); 

  //If all the provided MAC addresses are invalid, the response will be an empty array.
  if (validSensorMacs.length === 0) {
      return []; //empty array of Measurements
  }



  const measurements: MeasurementDAO[] = await repo.getMeasurementsByNetworkAndSensors(networkCode, validSensorMacs, startDate, endDate);  

  const measurementsBySensor: { [sensorMac: string]: MeasurementDAO[] } = {};
  for (const measurement of measurements) {
    const mac = measurement.sensor.sensorMac; 
    if (!measurementsBySensor[mac]) {
      measurementsBySensor[mac] = [];
    }
    measurementsBySensor[mac].push(measurement);
  }

  const measurementsDTO: Measurements[] = [];
  //we have to return a measurementsDTO with just sensorMac + stats (NO measurementDTO array)
  for (const mac of validSensorMacs) {
    const sensorSpecificData = measurementsBySensor[mac] || []; //if no measurements, it will be an empty array
    //if sensorSpecificData is empty, we still want to return a Measurements DTO with sensorMac and as statdDTO all zeros
    let measurementDTO: Measurements
    if (sensorSpecificData.length === 0) {
      //if we have no measurements, we return the sensorMac with empty stats with all zeros
      measurementDTO = {
        sensorMacAddress: mac
        //stats: defaultStats no stats!
      }

    } else {
      const stats: Stats = getStatsDTO(sensorSpecificData, startDate, endDate); 
      measurementDTO = {
        sensorMacAddress: mac,
        stats: stats
      };
    }
    measurementsDTO.push(measurementDTO);
  }

  return measurementsDTO;
}

/**
 * Store a measurement in the database
 * @param {string} sensorMac - The mac address of the sensor
 * @param {string} gatewayMac - The mac address of the gateway
 * @param {string} networkCode - The network code to associate with the measurement
 * @param {Measurement} measurement - The Measurement DTO object to store
 * @returns {Promise<void>} - void
 * @throws {NotFoundError} - If the network is not found, or gateway is not found, or sensor mac is not found
 */
export async function storeMeasurement(sensorMac: string, gatewayMac: string, networkCode: string, measurement: Measurement): Promise<void> {
  const repo = new MeasurementRepository();
  await repo.createMeasurement(networkCode, gatewayMac, sensorMac, measurement.createdAt, measurement.value); 
}

/**
 * Get measurements of a sensor
 * @param {string} sensorMac - The mac address of the sensor
 * @param {string} gatewayMac - The mac address of the gateway
 * @param {string} networkCode - The network code to filter measurements
 * @param {boolean} onlyOutliers - If true, only outliers will be included in the result. Default is false
 * @param {Date} startDate - The start date for filtering measurements. Optional
 * @param {Date} endDate - The end date for filtering measurements. Optional
 * @returns {Promise<Measurements>} - The Measurements DTO object
 * @throws {NotFoundError} - If the network is not found, or gateway is not found, or sensor macs are not found
 */
export async function getMeasurementsBySensor(sensorMac: string, gatewayMac: string, networkCode: string, onlyOutliers:boolean = false, startDate?: Date, endDate?: Date): Promise<Measurements> {
  const repo = new MeasurementRepository();
  const measurements: MeasurementDAO[] = await repo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, startDate, endDate);  //vec di measDAO
  
  if (measurements.length === 0) {
    //return a Measurements DTO with just the sensorMac
    return {
      sensorMacAddress: sensorMac
    } as Measurements;
  }

  //if onlyOutliers is true, we want to skip the measurements that are not outliers
  const stats: Measurements = getMeasurementsDTO(measurements, sensorMac, onlyOutliers, startDate, endDate); 
  return stats;
}

/**
 * Get stats for a sensor
 * @param {string} sensorMac - The mac address of the sensor
 * @param {string} gatewayMac - The mac address of the gateway
 * @param {string} networkCode - The network code to filter measurements
 * @param {Date} startDate - The start date for filtering measurements. Optional
 * @param {Date} endDate - The end date for filtering measurements. Optional
 * @returns {Promise<Stats>} - The Stats DTO object
 * @throws {NotFoundError} - If the network is not found, or gateway is not found, or sensor mac is not found
 */
export async function getStatsBySensor(sensorMac: string, gatewayMac: string, networkCode: string, startDate?: Date, endDate?: Date): Promise<Stats> {
  const repo = new MeasurementRepository();
  const measurements: MeasurementDAO[] = await repo.getMeasurementsBySensor(networkCode, gatewayMac, sensorMac, startDate, endDate); 
  
  //if sensor has no measurements, we return a Stats DTO with all zeros
  if (measurements.length === 0) {
    return defaultStats; //all zeros
  } 

  const stats: Stats = getStatsDTO(measurements, startDate, endDate);
  return stats;
}


