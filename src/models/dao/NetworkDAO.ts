/**
 * NetworkDAO.ts
 * Creation Date: 2025-05-01
 * Last Revision Date: 2025-05-17 -> set nullable: true for name, description
 * SWE Group 54
 */
import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import { GatewayDAO } from "./GatewayDAO";

@Entity("networks")
export class NetworkDAO { 

    //alphanumeric unique identifier for the network
    @PrimaryColumn({ nullable: false, length: 255 })
    networkCode: string;


    //Network name
    @Column({ nullable: true, length: 255 })
    networkName: string;

    //Network description
    @Column({ nullable: true, length: 255 })
    networkDescription: string;

    /**
     * Gateways in the network
     * A network can have multiple gateways
     * Each gateway has just one network
     * So, from the pov of the network, it is a one-to-many relationship
     */
    @OneToMany(() => GatewayDAO, (gateway) => gateway.network, {
        nullable: true
    })
    gateways: GatewayDAO[]; //array of gateways in the network


    
}