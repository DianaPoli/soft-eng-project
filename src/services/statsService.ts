/**
 * NetworkDAO.ts
 * Creation Date: 2025-05-11
 * Last Revision Date: 2025-05-11
 * SWE Group 54
 */

import { MeasurementDAO } from "@dao/MeasurementDAO";
import { Stats as StatsDTO, Measurement as MeasurementDTO, Measurements as MeasurementsDTO} from "@dto/index";


function computeMean(numbers: number[]): number {
    //check of the array is empty is not needed since it is already done in the getStatsDTO function
    //use stream to compute the sum of numbers
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    //return the mean
    return sum / numbers.length;
}

function computeVariance(numbers: number[], mean: number): number {
    if (numbers.length < 2) {
        return 0;
    }
    //use stream to compute the variance
    //Here the user just want to see how the closed set population of samples varies, so we use poulation variance
    //V(X) = 1/(n) * sum_{i=1}^n (xi - mean)^2
    const variance = numbers.reduce((acc, num) => acc + Math.pow(num - mean, 2), 0);
    //return the variance
    return variance / numbers.length; //(numbers.length - 1);
}

function computeThresholds(mean: number, variance:number): { lowerThreshold: number, upperThreshold: number } {

    //compute the upper and lower thresholds
    //lowerThreshold = mean - 2 * stdDev
    //upperThreshold = mean + 2 * stdDev

    //1. comput std dev
    const stdDev = Math.sqrt(variance);
    //2. compute the thresholds
    return {
        lowerThreshold: mean - 2 * stdDev,
        upperThreshold: mean + 2 * stdDev
    }
}

/**
 * Get the stats DTO: mean, variance, thresholds
 * @param {MeasurementDAO[]} measurements - The array of MeasurementDAO objects
 * @param {Date} startDate - The start date for filtering measurements. Optional
 * @param {Date} endDate - The end date for filtering measurements. Optional
 * @returns {StatsDTO} - The StatsDTO object containing mean, variance, and thresholds
 */
export function getStatsDTO(
    measurements: MeasurementDAO[],
    startDate?: Date,
    endDate?: Date
): StatsDTO {

    //extract the values from the measurements
    const measurementsValues: number[] = measurements.map((measurement) => measurement.value);

    //1. compute the mean
    const mean = computeMean(measurementsValues);
    //2. compute the variance
    const variance = computeVariance(measurementsValues, mean);
    //3. compute the thresholds
    const thresholds = computeThresholds(mean, variance);

    //create and populate the stats object
    const resStats: StatsDTO = {
        mean: mean,
        variance: variance,
        upperThreshold: thresholds.upperThreshold,
        lowerThreshold: thresholds.lowerThreshold,
    }

    if (startDate) {
        resStats.startDate = startDate;
    }
    if (endDate) {
        resStats.endDate = endDate;
    }
    
    return resStats;
}

/**
 * Get the measurements DTO: stats + measurements
 * @param {MeasurementDAO[]} measurements - The array of MeasurementDAO objects
 * @param {string} sensorMac - The mac address of the sensor
 * @param {boolean} onlyOutliers - If true, only outliers will be included in the result
 * @param {Date} startDate - The start date for filtering measurements. Optional
 * @param {Date} endDate - The end date for filtering measurements. Optional
 * @returns {MeasurementsDTO} - The MeasurementsDTO object containing stats and measurements
 */
export function getMeasurementsDTO(
    measurements: MeasurementDAO[],
    sensorMac: string,
    onlyOutliers: boolean,
    startDate?: Date,
    endDate?: Date,
): MeasurementsDTO {

    //first, compute stats
    let stats : StatsDTO
    if (startDate || endDate){
        if (startDate && endDate) {
            stats = getStatsDTO(measurements, startDate, endDate);
        } else if (startDate) {
            stats = getStatsDTO(measurements, startDate);
        } else {
            stats = getStatsDTO(measurements, undefined, endDate);
        }
    } else {
        stats = getStatsDTO(measurements);
    }

    const lowerThreshold = stats.lowerThreshold;
    const upperThreshold = stats.upperThreshold;

    let resMeasurements: MeasurementDTO[] = []; //init the array of Measurement DTOs

    for (const measurementDao of measurements) {
        const checkOutlier = measurementDao.value < lowerThreshold || measurementDao.value > upperThreshold;

        //if onlyOutliers is true, we want to skip the measurements that are not outliers
        if (onlyOutliers && !checkOutlier) {
            continue; 
        }

        const labeledMeasurement: MeasurementDTO = {
            createdAt: measurementDao.createdAt,
            value: measurementDao.value,
            isOutlier: checkOutlier,
        };

        //add the labeled measurement to the result array
        resMeasurements.push(labeledMeasurement);
    }


    //return the Measurements DTO 
    const res: MeasurementsDTO = {
        sensorMacAddress: sensorMac,
        stats: stats,
        measurements: resMeasurements
    }

    return res;
}