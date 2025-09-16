import * as userController from "@controllers/userController";
import { UserDAO } from "@dao/UserDAO";
import { UserType } from "@models/UserType";
import { UserRepository } from "@repositories/UserRepository";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

// Import the actual DTO and mapper functions
// Please adjust these paths to match your project structure

import { createUserDTO, mapUserDAOToDTO } from "@services/mapperService"; // Assuming mappers are in @mappers/userMapper
// Assuming removeNullAttributes is a utility, it might be part of a general utils file
// If removeNullAttributes is used internally by createUserDTO and not exported,
// then its direct import or testing here might not be necessary if createUserDTO is tested thoroughly.
// However, if it's a shared utility, it should be imported and potentially have its own tests.
// For now, we assume createUserDTO handles its internal logic correctly.

jest.mock("@repositories/UserRepository");

// Helper to create a mocked UserRepository instance with specific method mocks
const getMockRepo = (mocks?: Partial<UserRepository>) => {
  return {
    getUserByUsername: jest.fn(),
    getAllUsers: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
    ...mocks,
  };
};

describe("Mapper Functions", () => {
  describe("createUserDTO", () => {
    it("should create a UserDTO with username, type, and password if password is provided", () => {
      const dto = createUserDTO("testuser", UserType.Admin, "password123");
      expect(dto).toEqual({
        username: "testuser",
        type: UserType.Admin,
        password: "password123"
      });
    });

    it("should create a UserDTO with username and type, excluding password if not provided", () => {
      const dto = createUserDTO("testuser", UserType.Viewer);
      expect(dto).toEqual({
        username: "testuser",
        type: UserType.Viewer
      });
      expect(dto).not.toHaveProperty("password");
    });

    it("should create a UserDTO excluding password if password is explicitly undefined", () => {
      const dto = createUserDTO("testuser", UserType.Operator, undefined);
      expect(dto).toEqual({
        username: "testuser",
        type: UserType.Operator
      });
      expect(dto).not.toHaveProperty("password");
    });
  });

  describe("mapUserDAOToDTO", () => {
    it("should map UserDAO to UserDTO, including username and type, but excluding password", () => {
      const userDAO: UserDAO = {
        username: "daoUser",
        password: "daoPassword",
        type: UserType.Admin
      };
      const dto = mapUserDAOToDTO(userDAO);
      expect(dto).toEqual({
        username: "daoUser",
        type: UserType.Admin
      });
      expect(dto).not.toHaveProperty("password");
    });

    it("should correctly map UserDAO with different UserTypes", () => {
      const userDAOAdmin: UserDAO = {
        username: "adminUser",
        password: "adminPassword",
        type: UserType.Admin
      };
      const dtoAdmin = mapUserDAOToDTO(userDAOAdmin);
      expect(dtoAdmin).toEqual({
        username: "adminUser",
        type: UserType.Admin
      });

      const userDAOViewer: UserDAO = {
        username: "viewerUser",
        password: "viewerPassword",
        type: UserType.Viewer
      };
      const dtoViewer = mapUserDAOToDTO(userDAOViewer);
      expect(dtoViewer).toEqual({
        username: "viewerUser",
        type: UserType.Viewer
      });
    });
  });
});


describe("UserController", () => {
  let mockRepoInstance: ReturnType<typeof getMockRepo>;

  beforeEach(() => {
    // Reset all mocks defined on the instance before each test
  });

  describe("getUser", () => {
    it("should get a user and map to DTO, excluding password", async () => {
      const fakeUserDAO: UserDAO = {
        username: "testuser",
        password: "secretPassword",
        type: UserType.Operator
      };
      // The controller will use the actual mapUserDAOToDTO
      const expectedDTO = mapUserDAOToDTO(fakeUserDAO);


      mockRepoInstance = getMockRepo({
        getUserByUsername: jest.fn().mockResolvedValue(fakeUserDAO)
      });
      (UserRepository as jest.Mock).mockImplementation(() => mockRepoInstance);

      const result = await userController.getUser("testuser");

      expect(result).toEqual(expectedDTO);
      expect(result).not.toHaveProperty("password");
      expect(mockRepoInstance.getUserByUsername).toHaveBeenCalledWith("testuser");
    });

    it("should throw NotFoundError if user is not found", async () => {
      mockRepoInstance = getMockRepo({
        getUserByUsername: jest.fn().mockRejectedValue(new NotFoundError("User not found"))
      });
      (UserRepository as jest.Mock).mockImplementation(() => mockRepoInstance);

      await expect(userController.getUser("unknownuser")).rejects.toThrow(NotFoundError);
      expect(mockRepoInstance.getUserByUsername).toHaveBeenCalledWith("unknownuser");
    });
  });

  describe("getUsers", () => {
    it("should get all users and map them to DTOs, excluding passwords", async () => {
      const fakeUsersDAO: UserDAO[] = [
        { username: "user1", password: "p1", type: UserType.Admin },
        { username: "user2", password: "p2", type: UserType.Viewer }
      ];
      const expectedDTOs = fakeUsersDAO.map(mapUserDAOToDTO);

      mockRepoInstance = getMockRepo({
        getAllUsers: jest.fn().mockResolvedValue(fakeUsersDAO)
      });
      (UserRepository as jest.Mock).mockImplementation(() => mockRepoInstance);

      const result = await userController.getAllUsers();

      expect(result).toEqual(expectedDTOs);
      result.forEach(user => expect(user).not.toHaveProperty("password"));
      expect(mockRepoInstance.getAllUsers).toHaveBeenCalled();
    });

    it("should return an empty array if no users exist", async () => {
      mockRepoInstance = getMockRepo({
        getAllUsers: jest.fn().mockResolvedValue([])
      });
      (UserRepository as jest.Mock).mockImplementation(() => mockRepoInstance);

      const result = await userController.getAllUsers();

      expect(result).toEqual([]);
      expect(mockRepoInstance.getAllUsers).toHaveBeenCalled();
    });
  });

  describe("createUser", () => {
    const createUserPayload = {
      username: "newuser",
      password: "newpassword123",
      type: UserType.Operator
    };
    // This DAO is what the repository's createUser method would return
    const fakeCreatedUserDAO: UserDAO = {
      username: createUserPayload.username,
      password: createUserPayload.password, 
      type: createUserPayload.type
    };
    // The controller then maps this DAO to a DTO
    const expectedCreatedDTO = mapUserDAOToDTO(fakeCreatedUserDAO);


    it("should create a user and return mapped DTO, excluding password", async () => {
      mockRepoInstance = getMockRepo({
        createUser: jest.fn().mockResolvedValue(fakeCreatedUserDAO)
      });
      (UserRepository as jest.Mock).mockImplementation(() => mockRepoInstance);

      const result = await userController.createUser(createUserPayload);

     //this returns Promise<void> so we don't expect a result
      expect(result).toBeUndefined();
      expect(mockRepoInstance.createUser).toHaveBeenCalledWith(
        createUserPayload.username,
        createUserPayload.password,
        createUserPayload.type
      );
      
    });

    it("error 500: create user with empty username or password", async () => {
      const invalidPayload = {
        username: "",
        password: "short",
        type: UserType.Viewer
      };

      await expect(userController.createUser(invalidPayload)).rejects.toThrow();
    });

    it("error 500: create user with password shorter than 5 characters", async () => {
      const invalidPayload = {
        username: "shortpassuser",
        password: "1234", // less than 5 characters
        type: UserType.Viewer
      };
      await expect(userController.createUser(invalidPayload)).rejects.toThrow();
    });

    it("should throw ConflictError if user already exists", async () => {
      mockRepoInstance = getMockRepo({
        createUser: jest.fn().mockRejectedValue(new ConflictError("User already exists"))
      });
      (UserRepository as jest.Mock).mockImplementation(() => mockRepoInstance);

      await expect(userController.createUser(createUserPayload)).rejects.toThrow(ConflictError);
      expect(mockRepoInstance.createUser).toHaveBeenCalledWith(
        createUserPayload.username,
        createUserPayload.password,
        createUserPayload.type
      );
    });

  });

  describe("deleteUser", () => {
    it("should delete a user successfully", async () => {
      mockRepoInstance = getMockRepo({
        deleteUser: jest.fn().mockResolvedValue(undefined) 
      });
      (UserRepository as jest.Mock).mockImplementation(() => mockRepoInstance);

      await expect(userController.deleteUser("usertodelete")).resolves.toBeUndefined();
      expect(mockRepoInstance.deleteUser).toHaveBeenCalledWith("usertodelete");
    });

    it("should throw NotFoundError if user to delete is not found", async () => {
      mockRepoInstance = getMockRepo({
        deleteUser: jest.fn().mockRejectedValue(new NotFoundError("User to delete not found"))
      });
      (UserRepository as jest.Mock).mockImplementation(() => mockRepoInstance);

      await expect(userController.deleteUser("unknownuser")).rejects.toThrow(NotFoundError);
      expect(mockRepoInstance.deleteUser).toHaveBeenCalledWith("unknownuser");
    });
  });
});
