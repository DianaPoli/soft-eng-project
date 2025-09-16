import {
  authenticateUser,
  AuthenticatedRequest,
} from "@middlewares/authMiddleware"; 
import { UserType } from "@models/UserType";
import * as authService from "@services/authService";
import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { InsufficientRightsError } from "@errors/InsufficientRightsError";

// Mock the authService
jest.mock("@services/authService");

describe("AuthMiddleware - authenticateUser", () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockProcessToken: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    mockNext = jest.fn();
    mockProcessToken = authService.processToken as jest.Mock;
    mockProcessToken.mockReset(); // Reset mock before each test
  });

  it("should call next() without arguments if processToken resolves successfully", async () => {
    // Arrange
    const allowedRoles = [UserType.Admin];
    mockRequest.headers = { authorization: "Bearer validtoken123" };
    mockProcessToken.mockResolvedValue(undefined); // Simulate successful token processing

    const middleware = authenticateUser(allowedRoles);

    // Act
    await middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockProcessToken).toHaveBeenCalledWith(
      "Bearer validtoken123",
      allowedRoles
    );
    expect(mockNext).toHaveBeenCalledWith(); // Called with no arguments
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it("should call next() with error if processToken throws UnauthorizedError", async () => {
    // Arrange
    const allowedRoles = [UserType.Operator];
    mockRequest.headers = { authorization: "Bearer invalidtoken" };
    const unauthorizedError = new UnauthorizedError("Invalid token");
    mockProcessToken.mockRejectedValue(unauthorizedError);

    const middleware = authenticateUser(allowedRoles);

    // Act
    await middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockProcessToken).toHaveBeenCalledWith(
      "Bearer invalidtoken",
      allowedRoles
    );
    expect(mockNext).toHaveBeenCalledWith(unauthorizedError);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it("should call next() with error if processToken throws InsufficientRightsError", async () => {
    // Arrange
    const allowedRoles = [UserType.Admin];
    mockRequest.headers = { authorization: "Bearer validtokenbutnotadmin" };
    const insufficientRightsError = new InsufficientRightsError(
      "User does not have sufficient rights"
    );
    mockProcessToken.mockRejectedValue(insufficientRightsError);

    const middleware = authenticateUser(allowedRoles);

    // Act
    await middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockProcessToken).toHaveBeenCalledWith(
      "Bearer validtokenbutnotadmin",
      allowedRoles
    );
    expect(mockNext).toHaveBeenCalledWith(insufficientRightsError);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it("should call next() with error if processToken throws a generic error", async () => {
    // Arrange
    const allowedRoles = [UserType.Viewer];
    mockRequest.headers = { authorization: "Bearer sometoken" };
    const genericError = new Error("Something went wrong");
    mockProcessToken.mockRejectedValue(genericError);

    const middleware = authenticateUser(allowedRoles);

    // Act
    await middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockProcessToken).toHaveBeenCalledWith(
      "Bearer sometoken",
      allowedRoles
    );
    expect(mockNext).toHaveBeenCalledWith(genericError);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it("should call processToken with an empty array for allowedRoles if none are provided to authenticateUser", async () => {
    // Arrange
    mockRequest.headers = { authorization: "Bearer tokenforall" };
    mockProcessToken.mockResolvedValue(undefined);

    const middleware = authenticateUser(); // No roles passed

    // Act
    await middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockProcessToken).toHaveBeenCalledWith(
      "Bearer tokenforall",
      [] // Expect empty array
    );
    expect(mockNext).toHaveBeenCalledWith();
  });

   it("should call processToken with specific multiple allowedRoles", async () => {
    // Arrange
    const specificRoles = [UserType.Operator, UserType.Viewer];
    mockRequest.headers = { authorization: "Bearer multiroletoken" };
    mockProcessToken.mockResolvedValue(undefined);

    const middleware = authenticateUser(specificRoles);

    // Act
    await middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockProcessToken).toHaveBeenCalledWith(
      "Bearer multiroletoken",
      specificRoles
    );
    expect(mockNext).toHaveBeenCalledWith();
  });


  it("should call next() with UnauthorizedError if authorization header is missing", async () => {
    // Arrange
    // No authorization header set in mockRequest.headers
    const middleware = authenticateUser([UserType.Admin]);
    // processToken is expected to be called with undefined token, and it should handle this by throwing.
    // We simulate this behavior in the mock for this specific test case.
    mockProcessToken.mockImplementation(async (token, roles) => {
        if (token === undefined) {
            throw new UnauthorizedError("Authorization header is missing");
        }
        // Normal successful processing for other cases if needed in this mock
        return Promise.resolve(); 
    });


    // Act
    await middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockProcessToken).toHaveBeenCalledWith(undefined, [UserType.Admin]);
    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("should call next() with UnauthorizedError if authorization header is not a Bearer token (malformed)", async () => {
    // Arrange
    mockRequest.headers = { authorization: "NotBearer someothertoken" };
    const middleware = authenticateUser([UserType.Admin]);
     // processToken is expected to be called with the malformed token, and it should handle this.
    mockProcessToken.mockImplementation(async (token, roles) => {
        if (typeof token === 'string' && !token.startsWith("Bearer ")) {
            throw new UnauthorizedError("Malformed token: Not a Bearer token");
        }
        return Promise.resolve();
    });

    // Act
    await middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockProcessToken).toHaveBeenCalledWith("NotBearer someothertoken", [UserType.Admin]);
    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

});
