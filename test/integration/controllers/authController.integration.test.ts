import { getToken } from "@controllers/authController"; // Assuming your controller is in this path
import { User as UserDTO } from "@dto/User";
import { Token as TokenDTO } from "@models/dto/Token";
import { UserDAO } from "@dao/UserDAO"; // Assuming UserDAO is in this path
import { UserType } from "@models/UserType"; // Assuming UserType is in this path
import { UserRepository } from "@repositories/UserRepository";
import * as authService from "@services/authService"; // To mock generateToken
import * as mapperService from "@services/mapperService"; // We'll use actual mappers but could spy if needed
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { NotFoundError } from "@errors/NotFoundError"; // Assuming UserRepository throws this

// Mock the UserRepository
jest.mock("@repositories/UserRepository");

// Mock the authService specifically for generateToken
jest.mock("@services/authService", () => ({
  ...jest.requireActual("@services/authService"), // Import and retain default behavior
  generateToken: jest.fn(), // Mock generateToken
}));

describe("AuthController - getToken Integration Tests", () => {
  let mockGetUserByUsername: jest.Mock;
  let mockGenerateToken: jest.Mock;

  beforeEach(() => {
    // Setup mocks for each test
    mockGetUserByUsername = jest.fn();
    UserRepository.prototype.getUserByUsername = mockGetUserByUsername;

    mockGenerateToken = authService.generateToken as jest.Mock;

    // Reset mocks to clear any previous state
    mockGetUserByUsername.mockReset();
    mockGenerateToken.mockReset();
  });

  const testUserDAO: UserDAO = {
    username: "testuser",
    password: "hashedpassword123", // Simulate a stored hashed password
    type: UserType.Admin,
  };

  const loginUserDTO: UserDTO = {
    username: "testuser",
    password: "password123", // Plain text password from user
  };

  it("should return a TokenDTO on successful authentication", async () => {
    // Arrange
    const fakeStoredUserDAO: UserDAO = {
      ...testUserDAO,
      password: loginUserDTO.password, // For this test, assume stored password matches input
    };
    mockGetUserByUsername.mockResolvedValue(fakeStoredUserDAO);

    const fakeGeneratedToken = "fake-jwt-token-string";
    mockGenerateToken.mockReturnValue(fakeGeneratedToken);

    // We use the actual mapperService functions
    const expectedTokenDTO: TokenDTO = mapperService.createTokenDTO(fakeGeneratedToken);

    // Act
    const result = await getToken(loginUserDTO);

    // Assert
    expect(mockGetUserByUsername).toHaveBeenCalledWith(loginUserDTO.username);
    // createUserDTO is called internally by getToken before generateToken
    // We expect generateToken to be called with the DTO created from fakeStoredUserDAO
    const expectedUserDtoForTokenGeneration = mapperService.createUserDTO(
      fakeStoredUserDAO.username,
      fakeStoredUserDAO.type,
      fakeStoredUserDAO.password // generateToken expects the DTO to include the password
    );
    expect(mockGenerateToken).toHaveBeenCalledWith(expectedUserDtoForTokenGeneration);
    expect(result).toEqual(expectedTokenDTO);
    expect(result.token).toBe(fakeGeneratedToken);
  });

  it("should throw UnauthorizedError if the password is invalid", async () => {
    // Arrange
    const fakeStoredUserDAOWithWrongPass: UserDAO = {
      ...testUserDAO,
      password: "differentStoredPassword", // Stored password does not match
    };
    mockGetUserByUsername.mockResolvedValue(fakeStoredUserDAOWithWrongPass);

    // Act & Assert
    await expect(getToken(loginUserDTO)).rejects.toThrow(UnauthorizedError);
    await expect(getToken(loginUserDTO)).rejects.toThrow("Invalid password");

    expect(mockGetUserByUsername).toHaveBeenCalledWith(loginUserDTO.username);
    expect(mockGenerateToken).not.toHaveBeenCalled(); // Token generation should not occur
  });

  it("should throw NotFoundError if the user does not exist", async () => {
    // Arrange
    const nonExistentUserDTO: UserDTO = {
      username: "unknownuser",
      password: "anypassword",
    };
    // Simulate UserRepository throwing NotFoundError
    mockGetUserByUsername.mockRejectedValue(
      new NotFoundError(`User with username '${nonExistentUserDTO.username}' not found`)
    );

    // Act & Assert
    await expect(getToken(nonExistentUserDTO)).rejects.toThrow(NotFoundError);
    await expect(getToken(nonExistentUserDTO)).rejects.toThrow(
        `User with username '${nonExistentUserDTO.username}' not found`
    );

    expect(mockGetUserByUsername).toHaveBeenCalledWith(nonExistentUserDTO.username);
    expect(mockGenerateToken).not.toHaveBeenCalled();
  });

  it("should re-throw errors from UserRepository if not NotFoundError (e.g., database error)", async () => {
    // Arrange
    const genericError = new Error("Database connection failed");
    mockGetUserByUsername.mockRejectedValue(genericError);

    // Act & Assert
    await expect(getToken(loginUserDTO)).rejects.toThrow(Error);
    await expect(getToken(loginUserDTO)).rejects.toThrow("Database connection failed");

    expect(mockGetUserByUsername).toHaveBeenCalledWith(loginUserDTO.username);
    expect(mockGenerateToken).not.toHaveBeenCalled();
  });

  it("should correctly pass user details from DAO to createUserDTO for token generation", async () => {
    // Arrange
    const specificUserDAO: UserDAO = {
      username: "specificUser",
      password: "specificPassword", // This password should match the input for success
      type: UserType.Operator,
    };
     const specificLoginDTO: UserDTO = {
      username: "specificUser",
      password: "specificPassword",
    };
    mockGetUserByUsername.mockResolvedValue(specificUserDAO);

    const fakeGeneratedToken = "specific-fake-token";
    mockGenerateToken.mockReturnValue(fakeGeneratedToken);

    // Spy on createUserDTO to ensure it's called correctly
    const createUserDTOSpy = jest.spyOn(mapperService, 'createUserDTO');

    // Act
    await getToken(specificLoginDTO);

    // Assert
    // Verify that createUserDTO was called with the exact details from specificUserDAO
    expect(createUserDTOSpy).toHaveBeenCalledWith(
      specificUserDAO.username,
      specificUserDAO.type,
      specificUserDAO.password // Ensure the password from DAO is passed for token context
    );
    
    const expectedUserDtoForToken = mapperService.createUserDTO(
        specificUserDAO.username,
        specificUserDAO.type,
        specificUserDAO.password
    );
    expect(mockGenerateToken).toHaveBeenCalledWith(expectedUserDtoForToken);

    createUserDTOSpy.mockRestore(); // Clean up spy
  });
});