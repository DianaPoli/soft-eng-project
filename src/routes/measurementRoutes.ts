import { CONFIG } from "@config";
import { authenticateUser } from "@middlewares/authMiddleware";
import { response, Router } from "express";
import { UserType } from "@models/UserType";
import { 
  getMeasurementsByNetwork,
  getStatsbyNetwork,
  getMeasurementsBySensor,
  getStatsBySensor,
  storeMeasurement
} from "@controllers/measurementController";
import { parseStringArrayParam, parseISODateParamToUTC } from "@utils";
import { Measurements as MeasurementsDTO, Stats as StatsDTO, 
  MeasurementFromJSON, MeasurementsToJSONTyped, StatsToJSON} from "@dto/index";


const router = Router();

// Store a measurement for a sensor (Admin & Operator)
router.post(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/measurements", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
      /*The body is an ARRAY of measurements, as swagger says:
      [
        {
          "createdAt": "2025-02-18T17:00:00+01:00",
          "value": 1.8567
        }
      ]
      */
      //so, iterate over the array and store each measurement
      //error policy: since error 500 is the only one that can be raised
      //we will store all the measurements that can be stored (i.e. for which the storeMeasurement function does not raise an error)
      //and if an error is raised, we will send a 500 error instead of 201
      //all the 500 errors will be raised in the same way, so we can just send the first one
      let error500Raised : any = undefined;
      for (const reqMeasurement of req.body) {
        try {
          await storeMeasurement(req.params.sensorMac, req.params.gatewayMac, req.params.networkCode, MeasurementFromJSON(reqMeasurement));
          
        } catch (error){
          //save the error to send it later
          if (!error500Raised){
            error500Raised = error;
          }
        } 
      }

      //if an error was raised, send a 500 error instead of 201
      if (error500Raised){
        next(error500Raised);
      }
      //all the storeMeasurement return Promise<void>, so we can send a 200 response without a body, if no measurements had errors
      res.status(201).send();
  }
);

// Retrieve measurements for a specific sensor
router.get(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/measurements", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), async (req, res, next) => {
    try {
      const startDate = req.query.startDate ? parseISODateParamToUTC(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? parseISODateParamToUTC(req.query.endDate) : undefined;

      const measurements: MeasurementsDTO = await getMeasurementsBySensor(req.params.sensorMac, req.params.gatewayMac, req.params.networkCode, false, startDate, endDate);
      res.status(200).json(MeasurementsToJSONTyped(measurements, false));
  
    } catch (error) {
      next(error);
    }
  }
);

// Retrieve statistics for a specific sensor
router.get(CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/stats", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), async (req, res, next) => {
  try {
    const startDate = req.query.startDate ? parseISODateParamToUTC(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? parseISODateParamToUTC(req.query.endDate) : undefined;
    const stats: StatsDTO = await getStatsBySensor(req.params.sensorMac, req.params.gatewayMac, req.params.networkCode, startDate, endDate)
    const responseJson = StatsToJSON(stats);
    res.status(200).json(responseJson);
  } catch (error) {
    next(error);
  }
});

// Retrieve only outliers for a specific sensor
router.get(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/outliers", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), async (req, res, next) => {
    try {
      const startDate = req.query.startDate ? parseISODateParamToUTC(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? parseISODateParamToUTC(req.query.endDate) : undefined;

      const measurements: MeasurementsDTO = await getMeasurementsBySensor(req.params.sensorMac, req.params.gatewayMac, req.params.networkCode, true, startDate, endDate);
      const responseJson = MeasurementsToJSONTyped(measurements, false);
      res.status(200).json(await getMeasurementsBySensor(req.params.sensorMac, req.params.gatewayMac, req.params.networkCode, true, startDate, endDate));
    
    } catch (error){
      next(error);
    }
  }
);

// Retrieve measurements for a set of sensors of a specific network
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/measurements", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), async (req, res, next) => {
    try {
      const sensorMacs = req.query.sensorMacs;
      let processedSensorMacs: string[] | undefined = undefined;

      processedSensorMacs = parseStringArrayParam(sensorMacs);    
      const startDate = req.query.startDate ? parseISODateParamToUTC(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? parseISODateParamToUTC(req.query.endDate) : undefined;
      
      const measurements: MeasurementsDTO[] = await getMeasurementsByNetwork(req.params.networkCode, false, processedSensorMacs, startDate, endDate);
      const responseJson = measurements.map(m => MeasurementsToJSONTyped(m, false));
      res.status(200).json(responseJson);
  
    } catch (error) {
      next(error);
    }
  }
);

// Retrieve statistics for a set of sensors of a specific network
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/stats", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), async (req, res, next) => {
    try {
      
      const sensorMacs = req.query.sensorMacs;
      let processedSensorMacs: string[] | undefined = undefined;
      
      processedSensorMacs = parseStringArrayParam(sensorMacs);
      const startDate = req.query.startDate ? parseISODateParamToUTC(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? parseISODateParamToUTC(req.query.endDate) : undefined;
      
      const measurements: MeasurementsDTO[] = await getStatsbyNetwork(req.params.networkCode, processedSensorMacs, startDate, endDate);
      const responseJson = measurements.map(m => MeasurementsToJSONTyped(m, false));
      res.status(200).json(responseJson);
  
    } catch (error) {
      next(error);
    }
  }
);

// Retrieve only outliers for a set of sensors of a specific network
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/outliers", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), async (req, res, next) => {
    try {
      const sensorMacs = req.query.sensorMacs;
      let processedSensorMacs: string[] | undefined = undefined;

      processedSensorMacs = parseStringArrayParam(sensorMacs);
      const startDate = req.query.startDate ? parseISODateParamToUTC(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? parseISODateParamToUTC(req.query.endDate) : undefined;
      
      const measurements: MeasurementsDTO[] = await getMeasurementsByNetwork(req.params.networkCode, true, processedSensorMacs, startDate, endDate)
      res.status(200).json(measurements.map(m => MeasurementsToJSONTyped(m, false)));
    } catch (error){
      next(error);
    }
  }
);

export default router;
