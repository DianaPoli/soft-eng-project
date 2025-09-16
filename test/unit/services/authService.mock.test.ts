import jwt from "jsonwebtoken";
import { User as UserDTO } from "@dto/User";
import { UserType } from "@models/UserType";
import { UserRepository } from "@repositories/UserRepository";
import { UserDAO } from "@dao/UserDAO";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { SECRET_KEY, TOKEN_LIFESPAN } from "@config"; 

// Import only the exported functions to be tested
import { generateToken, processToken } from "@services/authService";

// Mock dependencies
jest.mock("jsonwebtoken");
jest.mock("@repositories/UserRepository");

describe("AuthService (Exported Functions)", () => {
  const mockUserDTOForGenerate: UserDTO = {
    username: "testuser",
    type: UserType.Admin,
    password: "password123", 
  };

  const mockUserDAO: UserDAO = {
    username: "testuser",
    password: "hashedPassword", 
    type: UserType.Admin,
  };
  
  // This is the payload that jwt.verify would return
  const mockDecodedUserPayload: UserDTO = { 
    username: "testuser",
    type: UserType.Admin,
  };


  const mockJwtToken = "mocked.jwt.token";

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateToken", () => {
    it("should generate a JWT token with correct parameters", () => {
      (jwt.sign as jest.Mock).mockReturnValue(mockJwtToken);

      const token = generateToken(mockUserDTOForGenerate);

      expect(jwt.sign).toHaveBeenCalledWith(
        mockUserDTOForGenerate,
        SECRET_KEY,
        { expiresIn: TOKEN_LIFESPAN }
      );
      expect(token).toBe(mockJwtToken);
    });
  });

  describe("processToken", () => {
    let mockGetUserByUsername: jest.Mock;
    let jwtVerifyMock: jest.Mock;

    beforeEach(() => {
      mockGetUserByUsername = jest.fn();
      UserRepository.prototype.getUserByUsername = mockGetUserByUsername;
      jwtVerifyMock = jwt.verify as jest.Mock;
    });

    it("should resolve if token is valid, user exists, and no roles are required", async () => {
      const authHeader = `Bearer ${mockJwtToken}`;
      jwtVerifyMock.mockReturnValue(mockDecodedUserPayload);
      mockGetUserByUsername.mockResolvedValue(mockUserDAO);

      await expect(processToken(authHeader, [])).resolves.toBeUndefined();
      expect(jwtVerifyMock).toHaveBeenCalledWith(mockJwtToken, SECRET_KEY);
      expect(mockGetUserByUsername).toHaveBeenCalledWith(mockDecodedUserPayload.username);
    });

    it("should resolve if token is valid, user exists, and user role is in allowedRoles", async () => {
      const authHeader = `Bearer ${mockJwtToken}`;
      jwtVerifyMock.mockReturnValue(mockDecodedUserPayload); // type: Admin
      mockGetUserByUsername.mockResolvedValue(mockUserDAO);   // type: Admin

      await expect(
        processToken(authHeader, [UserType.Admin, UserType.Operator])
      ).resolves.toBeUndefined();
      expect(jwtVerifyMock).toHaveBeenCalledWith(mockJwtToken, SECRET_KEY);
      expect(mockGetUserByUsername).toHaveBeenCalledWith(mockDecodedUserPayload.username);
    });

    it("processToken, with allowedRoles not specified, test if assigned [] by the function", async () => {
        const authHeader = `Bearer ${mockJwtToken}`;
        jwtVerifyMock.mockReturnValue(mockDecodedUserPayload);
        mockGetUserByUsername.mockResolvedValue(mockUserDAO);
        await expect(
          processToken(authHeader)
        ).resolves.toBeUndefined();
        expect(jwtVerifyMock).toHaveBeenCalledWith(mockJwtToken, SECRET_KEY);
        expect(mockGetUserByUsername).toHaveBeenCalledWith(mockDecodedUserPayload.username);
    });

    it("should throw InsufficientRightsError if user role is not in allowedRoles", async () => {
      const authHeader = `Bearer ${mockJwtToken}`;
      const viewerUserDAO: UserDAO = { ...mockUserDAO, type: UserType.Viewer };
      const viewerDecodedPayload: UserDTO = { ...mockDecodedUserPayload, type: UserType.Viewer};

      jwtVerifyMock.mockReturnValue(viewerDecodedPayload);
      mockGetUserByUsername.mockResolvedValue(viewerUserDAO);

      await expect(
        processToken(authHeader, [UserType.Admin])
      ).rejects.toThrow(new InsufficientRightsError("Forbidden: Insufficient rights"));
      expect(jwtVerifyMock).toHaveBeenCalledWith(mockJwtToken, SECRET_KEY);
      expect(mockGetUserByUsername).toHaveBeenCalledWith(viewerDecodedPayload.username);
    });

    it("should throw UnauthorizedError if authHeader is missing", async () => {
      await expect(processToken(undefined, [])).rejects.toThrow(
        new UnauthorizedError("Unauthorized: No token provided")
      );
      expect(jwtVerifyMock).not.toHaveBeenCalled();
      expect(mockGetUserByUsername).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedError if authHeader is malformed (not Bearer)", async () => {
      const authHeader = "NotBearer token";
      await expect(processToken(authHeader, [])).rejects.toThrow(
        new UnauthorizedError("Unauthorized: Invalid token format")
      );
      expect(jwtVerifyMock).not.toHaveBeenCalled();
      expect(mockGetUserByUsername).not.toHaveBeenCalled();
    });



    it("should throw UnauthorizedError if jwt.verify throws an error (e.g., invalid/expired token)", async () => {
      const authHeader = `Bearer ${mockJwtToken}`;
      jwtVerifyMock.mockImplementation(() => {
        throw new jwt.JsonWebTokenError("jwt malformed");
      });

      await expect(processToken(authHeader, [])).rejects.toThrow(
        new UnauthorizedError("Unauthorized: ")
      );
      expect(jwtVerifyMock).toHaveBeenCalledWith(mockJwtToken, SECRET_KEY);
      expect(mockGetUserByUsername).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedError with specific message if userRepo.getUserByUsername throws (e.g., user not found)", async () => {
      const authHeader = `Bearer ${mockJwtToken}`;
      jwtVerifyMock.mockReturnValue(mockDecodedUserPayload);
      mockGetUserByUsername.mockRejectedValue(new Error("User not in DB")); // Simulate repo error

      await expect(processToken(authHeader, [])).rejects.toThrow(UnauthorizedError);
      await expect(processToken(authHeader, [])).rejects.toThrow(
        `Unauthorized: user ${mockDecodedUserPayload.username} not found`
      );
      expect(jwtVerifyMock).toHaveBeenCalledWith(mockJwtToken, SECRET_KEY);
      expect(mockGetUserByUsername).toHaveBeenCalledWith(mockDecodedUserPayload.username);
    });
    
    it("should throw UnauthorizedError if jwt.verify returns payload without username", async () => {
      const authHeader = `Bearer ${mockJwtToken}`;
      const payloadWithoutUsername = { type: UserType.Admin } as UserDTO; // Missing username
      jwtVerifyMock.mockReturnValue(payloadWithoutUsername);
      
      // UserRepository won't be called effectively if username is undefined, leading to error
      // or if it is called, the specific error message "user undefined not found" will occur
      mockGetUserByUsername.mockImplementation((username) => {
          if (username === undefined) {
              // Simulate what would happen, or let the actual repo method (if it was real) fail.
              // For this test, we assume the processToken's catch block handles the fallout.
              return Promise.reject(new Error("Attempted to find user with undefined username"));
          }
          return Promise.resolve(mockUserDAO);
      });

      await expect(processToken(authHeader, [])).rejects.toThrow(UnauthorizedError);
      await expect(processToken(authHeader, [])).rejects.toThrow(
        `Unauthorized: user undefined not found` 
      );
      expect(jwtVerifyMock).toHaveBeenCalledWith(mockJwtToken, SECRET_KEY);
      // Check if getUserByUsername was called, even if with undefined
      expect(mockGetUserByUsername).toHaveBeenCalledWith(undefined);
    });
  });
});