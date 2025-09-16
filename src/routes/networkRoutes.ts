import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import { NetworkFromJSON } from "@dto/Network";
import { createNetwork, deleteNetwork, getAllNetworks, getNetworkByNetworkCode, updateNetwork } from "@controllers/networkController";

const router = Router();


// Get all networks (Any authenticated user)
router.get("", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), async (req, res, next) => {
  try {
    res.status(200).json(await getAllNetworks());
  } catch (error) {
    next(error);
  }
});

// Get a network by code (Any authenticated user)
router.get("/:networkCode", authenticateUser([UserType.Admin, UserType.Operator, UserType.Viewer]), async (req, res, next) => {
  try {
    const { networkCode } = req.params;
    res.status(200).json(await getNetworkByNetworkCode(networkCode));
  } catch (error) {
    next(error);
  }
});

// Create a new network (Admin & Operator)
router.post("", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try {
    await createNetwork(NetworkFromJSON(req.body));
    res.status(201).send();
  } catch (error) {
    next(error);
  }
});

// Update a network (Admin & Operator)
router.patch("/:networkCode", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try {
    const { networkCode } = req.params;
    await updateNetwork(networkCode, NetworkFromJSON(req.body));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});



// Delete a network (Admin & Operator)
router.delete("/:networkCode", authenticateUser([UserType.Admin, UserType.Operator]), async (req, res, next) => {
  try {
    const { networkCode } = req.params;
    await deleteNetwork(networkCode);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});


export default router;
