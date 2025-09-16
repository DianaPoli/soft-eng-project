import request from "supertest";
import { app } from "@app"; 
import * as authController from "@controllers/authController";
import { User as UserDTO} from "@dto/User"; 
import { Token as TokenDTO } from "@models/dto/Token";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { NotFoundError } from "@errors/NotFoundError";
import { UserType } from "@models/UserType"; 

// Mock the authController
jest.mock("@controllers/authController");

describe("AuthRoutes - POST / (Authentication)", () => {
  let mockGetToken: jest.Mock;
  const authRoute = "/api/v1/auth"; 

  beforeEach(() => {
    mockGetToken = authController.getToken as jest.Mock;
    mockGetToken.mockReset();
  });

  const loginPayload = {
    username: "testuser@example.com",
    password: "password123",
    
  };


  const userDtoForController: UserDTO = {
      username: loginPayload.username,
      password: loginPayload.password,
  };


  it("should return 200 OK with a token on successful authentication", async () => {
    // Arrange
    const fakeToken: TokenDTO = { token: "fake-jwt-token" };
    mockGetToken.mockResolvedValue(fakeToken);

    // Act
    const response = await request(app)
      .post(authRoute)
      .send(loginPayload);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(fakeToken);
    expect(mockGetToken).toHaveBeenCalledWith(expect.objectContaining(userDtoForController));
  });

  it("should return 401 Unauthorized if getToken throws UnauthorizedError (e.g., invalid password)", async () => {
    // Arrange
    const errorMessage = "Invalid credentials - password";
    mockGetToken.mockRejectedValue(new UnauthorizedError(errorMessage));

    // Act
    const response = await request(app)
      .post(authRoute)
      .send(loginPayload);

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", errorMessage);
    expect(mockGetToken).toHaveBeenCalledWith(expect.objectContaining(userDtoForController));
  });

  it("should return 404 Not Found if getToken throws NotFoundError (e.g., user not found)", async () => {
    // Arrange
    const errorMessage = `User with username '${loginPayload.username}' not found`;
    mockGetToken.mockRejectedValue(new NotFoundError(errorMessage));

    // Act
    const response = await request(app)
      .post(authRoute)
      .send(loginPayload);

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", errorMessage);
    expect(mockGetToken).toHaveBeenCalledWith(expect.objectContaining(userDtoForController));
  });

  it("should return 500 Internal Server Error if getToken throws an unexpected error", async () => {
    // Arrange
    const errorMessage = "A surprising database error occurred!";
    mockGetToken.mockRejectedValue(new Error(errorMessage)); // Simulate a generic/unexpected error

    // Act
    const response = await request(app)
      .post(authRoute)
      .send(loginPayload);

    // Assert
    expect(response.status).toBe(500); // Default error handler should catch this
    expect(response.body).toHaveProperty("message", errorMessage); // Or a generic "Internal Server Error" depending on your error middleware
    expect(mockGetToken).toHaveBeenCalledWith(expect.objectContaining(userDtoForController));
  });
    it("should handle malformed request body with 400 Bad Request", async () => {
        // Act
        const response = await request(app)
        .post(authRoute)
        .send({}); // Sending an empty body
    
        // Assert
        expect(response.status).toBe(400); 
        expect(response.body).toBeDefined();
    });

});