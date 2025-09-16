import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import { GatewayFromJSON } from "@dto/Gateway";
import {
  getAllGatewaysByNetworkCode,
  getGatewayByNetworkCodeGatewayMac,
  createGateway,
  updateGateway,
  deleteGateway
} from "@controllers/gatewayController";


const router = Router({ mergeParams: true });

// Get all gateways (Any authenticated user)
router.get("", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), async (req, res, next) => {
  try {
    //all the request params are already validated by the openAPI validator middleware
    res.status(200).json(await getAllGatewaysByNetworkCode(req.params.networkCode));
  } catch (error) {
    //let the handler error middleware handle the error
    next(error);
  }
});

// Create a new gateway (Admin & Operator)
router.post("", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try {
    //extract the Gateway DTO from the request body
    await createGateway(GatewayFromJSON(req.body), req.params.networkCode);
    //createGateway return Promise<void>, so we can send a 200 response without a body
    res.status(201).send();
  } catch (error) {
    next(error);
  }
});

// Get a specific gateway (Any authenticated user)
router.get("/:gatewayMac", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), async (req, res, next) => {
  try {
    res.status(200).json(await getGatewayByNetworkCodeGatewayMac(req.params.gatewayMac, req.params.networkCode));
  } catch (error) {
    next(error);
  }
});

// Update a gateway (Admin & Operator)
router.patch("/:gatewayMac", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try {
    //extract the Gateway DTO from the request body
    await updateGateway(GatewayFromJSON(req.body), req.params.networkCode, req.params.gatewayMac);
    //updateGateway return Promise<void>, so we can send a 200 response without a body
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Delete a gateway (Admin & Operator)
router.delete("/:gatewayMac", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try {
    await deleteGateway(req.params.networkCode, req.params.gatewayMac);
    //deleteGateway return Promise<void>, so we can send a 200 response without a body
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
