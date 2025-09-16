/**
 * NetworkUpdate.ts
 * Creation Date: 2025-05-02
 * Last Revision Date: 2025-05-02
 * SWE Group 54
 */


/**
 * NetworkUpdate DTO
 * It's basically a DTO that will converted to a NetworkDAO object, which may have null properties, so be partial.
 * this will be converted by te network controller to a Partial<NetworkDAO> to be used 
 * in the update method of the network repository.
 * @export
 * @interface NetworkUpdate
 */
export interface NetworkUpdate {
    /**
     * The new code of the network.
     * @type {string}
     * @memberof NetworkUpdate
     */
    newNetworkCode?: string;
  
    /**
     * The new name of the network.
     * @type {string}
     * @memberof NetworkUpdate
     */
    newNetworkName?: string;
  
    /**
     * The new description of the network.
     * @type {string}
     * @memberof NetworkUpdate
     */
    newNetworkDescription?: string;
  }
  
  /**
   * Check if a given object implements the NetworkUpdate interface.
   */
  export function instanceOfNetworkUpdate(value: object): value is NetworkUpdate {
    return (
      typeof value === "object" &&
      value !== null &&
      ("newNetworkCode" in value ||
       "newNetworkName" in value ||
       "newNetworkDescription" in value)
    );
  }

  /**
   * Convert JSON to NetworkUpdate object.
   */
  export function NetworkUpdateFromJSON(json: any): NetworkUpdate {
    return {
      newNetworkCode: json["newNetworkCode"],
      newNetworkName: json["newNetworkName"],
      newNetworkDescription: json["newNetworkDescription"]
    };
  }
  
    /**
    * Convert NetworkUpdate object to JSON.
    */
  export function NetworkUpdateToJSON(value?: NetworkUpdate | null): any {
    if (value == null) return null;
    return {
      newNetworkCode: value.newNetworkCode,
      newNetworkName: value.newNetworkName,
      newNetworkDescription: value.newNetworkDescription
    };
  }
  


