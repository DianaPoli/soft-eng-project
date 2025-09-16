/**
 * SensorDAO.ts
 * Creation Date: 2025-05-01
 * Last Revision Date: 2025-05-01
 * SWE Group 54
 */

//this dao is for a SINGLE measurement, not for a list of measurements

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { SensorDAO } from "./SensorDAO";


@Entity("single_measurement")
export class MeasurementDAO {

    //the primary key is an id which is auto generated and auto incremented by the db 
    @PrimaryGeneratedColumn()
    id: number;

    //timestamp of the measurement in ISO 8601 format with local timezone of the sensor
    @Column({ nullable: false })
    createdAt: Date;

    //value of the measurement (can be either float or int)
    @Column("float",{ nullable: false })
    value: number;

    /**
     * Sensor to which the measurement belongs
     * A sensor can have multiple measurements
     * Each measurement has just one sensor
     * So, from the pov of the measurement, it is a many-to-one relationship
     */
    @ManyToOne(() => SensorDAO, (sensor) => sensor.measurements, {
        nullable: false, //since, as defined in the swagger, a new measurement must always be created in an existent sensor
        onDelete: "CASCADE", //if the sensor is deleted, all the measurements in the sensor are deleted too since, as defined in the swagger, they cannot exist without a sensor
        onUpdate: "CASCADE", //same as onDelete
    })
    //measurements table has foreign key sensorMac which references primary key sensorMac of table sensors
    @JoinColumn({ name: "sensorMac", referencedColumnName: "sensorMac" }) 
    sensor: SensorDAO; 

}