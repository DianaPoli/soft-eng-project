/**
 * SensorDAO.ts
 * Creation Date: 2025-05-01
 * Last Revision Date: 2025-05-17 -> set nullable: true for name, description, variable and unit
 * SWE Group 54
 */
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { GatewayDAO } from "./GatewayDAO";
import { MeasurementDAO } from "./MeasurementDAO";


@Entity("sensors")
export class SensorDAO {

    //alphanumeric unique MAC Address that identifies the sensor in the specific gateway
    @PrimaryColumn({ nullable: false, length: 17 }) //format: xx:xx:xx:xx:xx:xx so 12 hex digits (which are rapresentable as ASCII characters) and 5 colons
    sensorMac: string;

    //Sensor name
    @Column({ nullable: true, length: 255 })
    sensorName: string;

    //Sensor description
    @Column({ nullable: true, length: 255 })
    sensorDescription: string;

    //Sensor variable (ex temperature, humidity, etc.)
    @Column({ nullable: true, length: 255 })
    sensorVariable: string;

    //Sensur unit of measurement (ex Celsius, Fahrenheit, etc.)
    @Column({ nullable: true, length: 255 })
    sensorUnit: string;

    /**
     * Gateway to which the sensor is attached via serial interface
     * A gateway can have multiple sensors
     * A sensor has just one gateway
     * So, from the pov of the sensor, it is a many-to-one relationship
     */
    @ManyToOne(() => GatewayDAO, (gateway) => gateway.sensors, {
        nullable: false, //since, as defined in the swagger, a new sensor must always be created in an existent gateway
        onDelete: "CASCADE", //if the gateway is deleted, all the sensors in the gateway are deleted too since, as defined in the swagger, they cannot exist without a gateway
        onUpdate: "CASCADE", //same as onDelete
    })
    //sensors table has foreign key gatewayMac which references primary key gatewayMac of table gateways
    @JoinColumn({ name: "gatewayMac", referencedColumnName: "gatewayMac" }) 
    gateway: GatewayDAO;


    /**
     * Measurements taken by the sensor
     * A sensor can have multiple measurements
     * Each measurement has just one sensor
     * So, from the pov of the sensor, it is a one-to-many relationship
     */
    @OneToMany(() => MeasurementDAO, (measurement) => measurement.sensor, {
        nullable: true
    })
    measurements: MeasurementDAO[]; //array of measurements taken by the sensor


}