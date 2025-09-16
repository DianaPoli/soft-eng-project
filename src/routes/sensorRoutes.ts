import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import { SensorFromJSON } from "@dto/Sensor";
import {
  getAllSensorsByNetworkCodeGatewayMac,
  getSensorByNetworkCodeGatewayMacSensorMac,
  createSensor,
  updateSensor,
  deleteSensor
} from "@controllers/sensorController";


const router = Router({ mergeParams: true });

// Get all sensors (Any authenticated user)
router.get("", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), async (req, res, next) => {
    try {
      res.status(200).json(await getAllSensorsByNetworkCodeGatewayMac(req.params.networkCode, req.params.gatewayMac));
    } catch (error) {
      next(error);
    }
});

// Create a new sensor (Admin & Operator)
router.post("", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
    try {
      await createSensor(SensorFromJSON(req.body), req.params.networkCode, req.params.gatewayMac);
      res.status(201).send();
    } catch (error) {
      next(error);
    }
});

// Get a specific sensor (Any authenticated user)
router.get("/:sensorMac", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), async (req, res, next) => {
    try {
      res.status(200).json(await getSensorByNetworkCodeGatewayMacSensorMac(req.params.sensorMac, req.params.networkCode, req.params.gatewayMac));
    } catch (error) {
      next(error);
    }
});

// Update a sensor (Admin & Operator)
router.patch("/:sensorMac", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try {
      await updateSensor(req.body, req.params.networkCode, req.params.gatewayMac, req.params.sensorMac);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
});

// Delete a sensor (Admin & Operator)
router.delete("/:sensorMac", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
 try {
      await deleteSensor(req.params.networkCode, req.params.gatewayMac, req.params.sensorMac);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
});

export default router;
