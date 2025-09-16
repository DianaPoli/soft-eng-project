/**
 * GatewayDAO.ts
 * Creation date: 2025-05-01
 * Last revision date: 2025-05-17 -> set nullable: true for name, description
 * SWE Group 54
 */
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { NetworkDAO } from "./NetworkDAO";
import { SensorDAO } from "./SensorDAO";


@Entity("gateways")
export class GatewayDAO {
    //alphanumeric unique mac Address that identifies the gateway in the specific network
    @PrimaryColumn({ nullable: false, length: 17 }) //format: xx:xx:xx:xx:xx:xx so 12 hex digits (which are rapresentable as  ASCII characters) and 5 colons
    gatewayMac: string;

    //Gateway name
    @Column({ nullable: true, length: 255 })
    gatewayName: string;

    //Gateway description
    @Column({ nullable: true, length: 255 })
    gatewayDescription: string;

    /**
     * Network to which the gateway belongs
     * A network can have multiple gateways
     * Each gateway has just one network
     * So, from the pov of the gateway, it is a many-to-one relationship
     * The networkCode is the foreign key that references the networkCode in the network table
     */
    @ManyToOne(() => NetworkDAO, (network) => network.gateways, {
        nullable: false, //since, as defined in the swagger, a new gateways must always be created in an existent network
        onDelete: "CASCADE", //if the network is deleted, all the gateways in the network are deleted too since, as defined in the swagger, they cannot exist without a network
        onUpdate: "CASCADE", //same as onDelete       
    })
    //the @JoinColumn decorator is not required but I put it to explicitly set the name of the foreign key in the schema and have clearer ideas
    //gateways table has foreign key networkCode which references primary key networkCode of table networks
    @JoinColumn({name: "networkCode", referencedColumnName: "networkCode"}) 
    network: NetworkDAO;


    /**
     * Sensor connected via serial interface to the gateway
     * A gateway can have multiple sensors
     * Each sensor has just one gateway
     * So, from the pov of the gateway, it is a one-to-many relationship
     */
    @OneToMany(() => SensorDAO, (sensor) => sensor.gateway, {
        nullable: true
    })
    sensors: SensorDAO[]; //array of sensors attached to the gateway

}