import { ErrorDTO } from "@dto/ErrorDTO";
import { AppError } from "@errors/AppError";
import * as loggingService from "@services/loggingService";
import * as mapperService from "@services/mapperService";
import { createAppError } from "@services/errorService"; // Adjust path as needed

// Mock dependencies
jest.mock("@services/loggingService");
jest.mock("@services/mapperService");

describe("ErrorService - createAppError", () => {
  let mockLogError: jest.Mock;
  let mockCreateErrorDTO: jest.Mock;

  // Default ErrorDTO structure based on the provided interface
  const defaultErrorDTOInstance: ErrorDTO = {
    code: 500,
    message: "Internal Server Error",
    name: "InternalServerError",
  };

  beforeEach(() => {
    mockLogError = loggingService.logError as jest.Mock;
    mockCreateErrorDTO = mapperService.createErrorDTO as jest.Mock;

    // Default mock implementation for createErrorDTO
    // The first parameter 'status' from createAppError maps to 'code' in ErrorDTO
    mockCreateErrorDTO.mockImplementation((status, message, name) => ({
      code: status, // map status to code
      message,
      name,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should handle a standard Error object and return a default ErrorDTO", () => {
    const err = new Error("Something went wrong!");
    err.stack = "Error: Something went wrong!\n    at test (test.js:1:1)";
    
    const expectedInitialDTO: ErrorDTO = {
        code: 500, // Changed from status
        message: err.message,
        name: "InternalServerError",
    };
    mockCreateErrorDTO.mockReturnValueOnce(expectedInitialDTO); 

    const result = createAppError(err);

    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenNthCalledWith(1, err);
    expect(mockLogError).toHaveBeenNthCalledWith(
      2,
      `Error: ${err.message}\nStacktrace:\n${err.stack}`
    );

    expect(mockCreateErrorDTO).toHaveBeenCalledWith(
      500, // This is the status passed to createErrorDTO
      err.message,
      "InternalServerError"
    );
    expect(result).toEqual(expectedInitialDTO);
  });

  it("should handle an AppError instance and use its properties", () => {
    const appErr = new AppError("Custom App Error", 404);
    appErr.stack = "AppError: Custom App Error\n    at other (other.js:2:2)";

    const expectedSpecificDTO: ErrorDTO = {
      code: appErr.status, // AppError has 'status', DTO has 'code'
      message: appErr.message,
      name: appErr.name,
    };
    mockCreateErrorDTO
        .mockReturnValueOnce({ code: 500, message: appErr.message, name: "InternalServerError" }) 
        .mockReturnValueOnce(expectedSpecificDTO); 

    const result = createAppError(appErr);

    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenNthCalledWith(1, appErr);
    expect(mockLogError).toHaveBeenNthCalledWith(
      2,
      `Error: ${appErr.message}\nStacktrace:\n${appErr.stack}`
    );

    expect(mockCreateErrorDTO).toHaveBeenCalledTimes(2);
    expect(mockCreateErrorDTO).toHaveBeenNthCalledWith(1, 500, appErr.message, "InternalServerError");
    // appErr.status is passed as the first arg to createErrorDTO
    expect(mockCreateErrorDTO).toHaveBeenNthCalledWith(2, appErr.status, appErr.message, appErr.name);
    expect(result).toEqual(expectedSpecificDTO);
  });

  it("should handle a duck-typed error object with status and message", () => {
    const duckError = {
      status: 403, // duck-typed error has 'status'
      message: "Forbidden access",
      name: "ForbiddenError", 
      stack: "Error: Forbidden access\n at someFile.js:10:5"
    };
    const expectedSpecificDTO: ErrorDTO = {
      code: duckError.status, // DTO has 'code'
      message: duckError.message,
      name: duckError.name,
    };
     mockCreateErrorDTO
        .mockReturnValueOnce({ code: 500, message: duckError.message, name: "InternalServerError" })
        .mockReturnValueOnce(expectedSpecificDTO);

    const result = createAppError(duckError);

    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenNthCalledWith(1, duckError);
    expect(mockLogError).toHaveBeenNthCalledWith(
      2,
      `Error: ${duckError.message}\nStacktrace:\n${duckError.stack}`
    );
    
    expect(mockCreateErrorDTO).toHaveBeenCalledTimes(2);
    expect(mockCreateErrorDTO).toHaveBeenNthCalledWith(1, 500, duckError.message, "InternalServerError");
    // duckError.status is passed as the first arg to createErrorDTO
    expect(mockCreateErrorDTO).toHaveBeenNthCalledWith(2, duckError.status, duckError.message, duckError.name);
    expect(result).toEqual(expectedSpecificDTO);
  });

  it("should use default 'Internal Server Error' if err.message is missing for non-AppError", () => {
    const errNoMessage = { stack: "Some stack" }; 
    const expectedDTO: ErrorDTO = {
        code: 500, // Changed from status
        message: "Internal Server Error",
        name: "InternalServerError"
    };
    mockCreateErrorDTO.mockReturnValue(expectedDTO); 

    const result = createAppError(errNoMessage);

    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenNthCalledWith(1, errNoMessage);
    expect(mockLogError).toHaveBeenNthCalledWith(
      2,
      `Error: undefined\nStacktrace:\n${errNoMessage.stack}`
    );
    expect(mockCreateErrorDTO).toHaveBeenCalledWith(
      500,
      "Internal Server Error", 
      "InternalServerError"
    );
    expect(result).toEqual(expectedDTO);
  });

  it("should use 'No stacktrace available' if err.stack is missing", () => {
    const errNoStack = new Error("Error without stack");
    errNoStack.stack = undefined;

    const expectedInitialDTO: ErrorDTO = {
        code: 500, // Changed from status
        message: errNoStack.message,
        name: "InternalServerError"
    };
    mockCreateErrorDTO.mockReturnValue(expectedInitialDTO);

    createAppError(errNoStack); // Result not explicitly checked here, focus is on logError

    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenNthCalledWith(1, errNoStack);
    expect(mockLogError).toHaveBeenNthCalledWith(
      2,
      `Error: ${errNoStack.message}\nStacktrace:\nNo stacktrace available`
    );
  });

  it("should handle plain string input for err", () => {
    const errString = "Just a string error";
    // If err is a string, err?.message will be undefined.
    const initialExpectedMessage = "Internal Server Error";
     const initialDTO: ErrorDTO = {
        code: 500, // Changed from status
        message: initialExpectedMessage,
        name: "InternalServerError"
    };
    mockCreateErrorDTO.mockReturnValue(initialDTO);

    const result = createAppError(errString);

    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenNthCalledWith(1, errString);
    expect(mockLogError).toHaveBeenNthCalledWith(
      2,
      "Error: undefined\nStacktrace:\nNo stacktrace available" // err.message and err.stack are undefined
    );
    expect(mockCreateErrorDTO).toHaveBeenCalledWith(
      500,
      initialExpectedMessage,
      "InternalServerError"
    );
    expect(result).toEqual(initialDTO);
  });

   it("should handle an object with status but not an AppError instance (and potentially missing name)", () => {
    const duckErrorNoName = {
      status: 400, // duck-typed error has 'status'
      message: "Bad Request Input",
      // name is missing
      stack: "Error: Bad Request\n at someFile.js:10:5"
    };
    // If duckErrorNoName.name is undefined, then 'undefined' is passed to createErrorDTO for the name.
    // The mock implementation will set name: undefined in the DTO.
    const expectedSpecificDTO: ErrorDTO = {
      code: duckErrorNoName.status, // DTO has 'code'
      message: duckErrorNoName.message,
      name: undefined, // Reflecting that duckErrorNoName.name is undefined
    };
     mockCreateErrorDTO
        .mockReturnValueOnce({ code: 500, message: duckErrorNoName.message, name: "InternalServerError" })
        .mockReturnValueOnce(expectedSpecificDTO); 

    const result = createAppError(duckErrorNoName);

    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockCreateErrorDTO).toHaveBeenCalledTimes(2);
    // duckErrorNoName.status is passed as the first arg to createErrorDTO
    // duckErrorNoName.name is undefined and passed as the third arg
    expect(mockCreateErrorDTO).toHaveBeenNthCalledWith(2, duckErrorNoName.status, duckErrorNoName.message, undefined); 
    expect(result).toEqual(expectedSpecificDTO);
  });
});
