import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as userController from "@controllers/userController";
import { UserType } from "@models/UserType";
import { User as UserDTO } from "@dto/User"; 
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

jest.mock("@services/authService");
jest.mock("@controllers/userController");

describe("UserRoutes integration", () => {
  const token = "Bearer faketoken";
  const adminOnly = [UserType.Admin];
  const baseUserUrl = "/api/v1/users";

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- GET /api/v1/users (Get All Users) ---
  describe("GET /users (getAllUsers)", () => {
    it("should get all users successfully", async () => {
      const mockUsers: UserDTO[] = [
        { username: "admin", type: UserType.Admin },
        { username: "viewer", type: UserType.Viewer }
      ];

      (authService.processToken as jest.Mock).mockResolvedValue({ username: "requestingAdmin", type: UserType.Admin }); // Mock successful auth
      (userController.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get(baseUserUrl)
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(authService.processToken).toHaveBeenCalledWith(token, adminOnly);
      expect(userController.getAllUsers).toHaveBeenCalled();
    });

    it("should return 401 UnauthorizedError if no token is provided", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized: No token provided");
      });

      const response = await request(app)
        .get(baseUserUrl)
        .set("Authorization", "Bearer invalid"); // Token value doesn't matter as mock throws

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/);
      expect(userController.getAllUsers).not.toHaveBeenCalled();
    });

    it("should return 403 InsufficientRightsError if user is not Admin", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: Insufficient rights");
      });

      const response = await request(app)
        .get(baseUserUrl)
        .set("Authorization", token);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Insufficient rights/);
      expect(userController.getAllUsers).not.toHaveBeenCalled();
    });
  });

  it("should return 500 InternalServerError if an unexpected error occurs", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue({ username: "requestingAdmin", type: UserType.Admin });
    //mock the controller to throw an unexpected error
    (userController.getAllUsers as jest.Mock).mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    const response = await request(app)
      .get(baseUserUrl)
      .set("Authorization", token);

    expect(response.status).toBe(500);
  });

  // --- POST /api/v1/users (Create User) ---
  describe("POST /users (createUser)", () => {
    const newUserPayload = {
      username: "newbie",
      password: "password123",
      type: UserType.Viewer
    };
    // Assuming UserFromJSON(req.body) produces an object compatible with createUser controller arg
    const userForController = { // This is what UserFromJSON(req.body) would produce
        username: "newbie",
        password: "password123",
        type: UserType.Viewer
    };


    it("should create a user successfully", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue({ username: "requestingAdmin", type: UserType.Admin });
      (userController.createUser as jest.Mock).mockResolvedValue(undefined); // createUser in controller returns void or mapped DTO

      const response = await request(app)
        .post(baseUserUrl)
        .set("Authorization", token)
        .send(newUserPayload);

      expect(response.status).toBe(201);
      expect(authService.processToken).toHaveBeenCalledWith(token, adminOnly);
      // The route calls UserFromJSON(req.body) then passes it to createUser.
      // We expect createUser to be called with an object that matches newUserPayload structure.
      expect(userController.createUser).toHaveBeenCalledWith(expect.objectContaining(userForController));
    });

    it("should return 401 UnauthorizedError if no token is provided", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized");
      });

      const response = await request(app)
        .post(baseUserUrl)
        .set("Authorization", "Bearer invalid")
        .send(newUserPayload);

      expect(response.status).toBe(401);
      expect(userController.createUser).not.toHaveBeenCalled();
    });

    it("should return 403 InsufficientRightsError if user is not Admin", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden");
      });

      const response = await request(app)
        .post(baseUserUrl)
        .set("Authorization", token)
        .send(newUserPayload);

      expect(response.status).toBe(403);
      expect(userController.createUser).not.toHaveBeenCalled();
    });

    it("should return 409 ConflictError if user already exists", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue({ username: "requestingAdmin", type: UserType.Admin });
      (userController.createUser as jest.Mock).mockImplementation(() => {
        throw new ConflictError("User already exists");
      });

      const response = await request(app)
        .post(baseUserUrl)
        .set("Authorization", token)
        .send(newUserPayload);

      expect(response.status).toBe(409);
      expect(response.body.message).toMatch(/User already exists/);
    });
  });

  // --- GET /api/v1/users/:userName (Get User By Username) ---
  describe("GET /users/:userName (getUser)", () => {
    const targetUsername = "testuser";
    const mockUser: UserDTO = { username: targetUsername, type: UserType.Operator };

    it("should get a specific user successfully", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue({ username: "requestingAdmin", type: UserType.Admin });
      (userController.getUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get(`${baseUserUrl}/${targetUsername}`)
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(authService.processToken).toHaveBeenCalledWith(token, adminOnly);
      expect(userController.getUser).toHaveBeenCalledWith(targetUsername);
    });

    it("should return 401 UnauthorizedError", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized");
      });

      const response = await request(app)
        .get(`${baseUserUrl}/${targetUsername}`)
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(401);
      expect(userController.getUser).not.toHaveBeenCalled();
    });

    it("should return 403 InsufficientRightsError", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden");
      });

      const response = await request(app)
        .get(`${baseUserUrl}/${targetUsername}`)
        .set("Authorization", token);

      expect(response.status).toBe(403);
      expect(userController.getUser).not.toHaveBeenCalled();
    });

    it("should return 404 NotFoundError if user does not exist", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue({ username: "requestingAdmin", type: UserType.Admin });
      (userController.getUser as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("User not found");
      });

      const response = await request(app)
        .get(`${baseUserUrl}/${targetUsername}`)
        .set("Authorization", token);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/User not found/);
    });
  });

  // --- DELETE /api/v1/users/:userName (Delete User) ---
  describe("DELETE /users/:userName (deleteUser)", () => {
    const targetUsername = "deleteMe";

    it("should delete a user successfully", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue({ username: "requestingAdmin", type: UserType.Admin });
      (userController.deleteUser as jest.Mock).mockResolvedValue(undefined); // deleteUser returns void

      const response = await request(app)
        .delete(`${baseUserUrl}/${targetUsername}`)
        .set("Authorization", token);

      expect(response.status).toBe(204);
      expect(authService.processToken).toHaveBeenCalledWith(token, adminOnly);
      expect(userController.deleteUser).toHaveBeenCalledWith(targetUsername);
    });

    it("should return 401 UnauthorizedError", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized");
      });

      const response = await request(app)
        .delete(`${baseUserUrl}/${targetUsername}`)
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(401);
      expect(userController.deleteUser).not.toHaveBeenCalled();
    });

    it("should return 403 InsufficientRightsError", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden");
      });

      const response = await request(app)
        .delete(`${baseUserUrl}/${targetUsername}`)
        .set("Authorization", token);

      expect(response.status).toBe(403);
      expect(userController.deleteUser).not.toHaveBeenCalled();
    });

    it("should return 404 NotFoundError if user to delete does not exist", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue({ username: "requestingAdmin", type: UserType.Admin });
      (userController.deleteUser as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("User not found for deletion");
      });

      const response = await request(app)
        .delete(`${baseUserUrl}/${targetUsername}`)
        .set("Authorization", token);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/User not found for deletion/);
    });
  });
});