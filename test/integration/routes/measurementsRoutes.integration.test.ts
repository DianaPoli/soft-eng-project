/**
 * measurementsRoutes.integration.test.ts
 * Creation date: 2025-05-20
 * Last revision date: 2025-05-20
 * SWE Group 54
 */

import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as measurementController from "@controllers/measurementController";
import {
  Measurement as MeasurementDTO,
  Measurements as MeasurementsListDTO,
  Stats as StatsDTO,
  MeasurementsToJSONTyped, 
  StatsToJSON,
} from "@dto/index";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { parseISO } from "date-fns";
import { response } from 'express';




// Mock dependencies
jest.mock("@services/authService");
jest.mock("@controllers/measurementController");

describe("Measurement Routes Integration Tests", () => {
  const token = "Bearer faketoken";

  afterEach(() => {
    jest.clearAllMocks();
  });

  //
  // POST /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements
  //
  it("store measurement for a sensor - 201 Created", async () => {
    const measurement1 = {
      createdAt: new Date("2025-02-18T17:00:00Z").toISOString(),
      value: 1.2345,
    };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.storeMeasurement as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .post(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/measurements"
      )
      .set("Authorization", token)
      .send([measurement1]);

    //expect 201 and no body
    console.log("response: ", response.body);
    expect(response.status).toBe(201);
    expect(response.body).toEqual({});
    
    //this is he MeasurementDTO expected to be returned by the mapper
    const expectedmesurement1DTO: MeasurementDTO = {
      createdAt: new Date(measurement1.createdAt), //the DTO has the createdAt as Date, not String
      value: measurement1.value,
      isOutlier: undefined //optional value, not set in the request
    };
    expect(measurementController.storeMeasurement).toHaveBeenCalledTimes(1); //just one measurement to save
    expect(measurementController.storeMeasurement).toHaveBeenCalledWith(
      "00:00:00:00:00:01",
      "00:00:00:00:00:03",
      "NET01",
      expectedmesurement1DTO
    );
    
  });


  it("store multiple measurements - 201 Created", async () => {
    const measurement1 = {
      createdAt: new Date("2025-02-18T17:00:00Z").toISOString(),
      value: 1.2345,
    };
    const measurement2 = {
      createdAt: new Date("2025-02-18T18:00:00Z").toISOString(),
      value: 2.3456,
    };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.storeMeasurement as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .post(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/measurements"
      )
      .set("Authorization", token)
      .send([measurement1, measurement2]); //two measurements

    expect(response.status).toBe(201);
    expect(response.body).toEqual({});

    //this is the MeasurementDTO expected to be returned by the mapper
    const expectedmesurement1DTO: MeasurementDTO = {
      createdAt: new Date(measurement1.createdAt), 
      value: measurement1.value,
      isOutlier: undefined 
    };
    const expectedmesurement2DTO: MeasurementDTO = {
      createdAt: new Date(measurement2.createdAt), 
      value: measurement2.value,
      isOutlier: undefined 
    };
    
    expect(measurementController.storeMeasurement).toHaveBeenCalledTimes(2); //two measurements to save

    //check fist call of controller
    expect(measurementController.storeMeasurement).toHaveBeenNthCalledWith(
      1,
      "00:00:00:00:00:01",
      "00:00:00:00:00:03",
      "NET01",
      expectedmesurement1DTO
    );
    
    //check second call of controller
    expect(measurementController.storeMeasurement).toHaveBeenNthCalledWith(
      2,
      "00:00:00:00:00:01",
      "00:00:00:00:00:03",
      "NET01",
      expectedmesurement2DTO
    );
  });


  it("store measurement - 500 Internal Server Error", async () => {
    const measurement1 = {
      createdAt: new Date("2025-02-18T17:00:00Z").toISOString(),
      value: 1.2345,
    };
    const measurement2 = {
      createdAt: new Date("2025-02-18T18:00:00Z").toISOString(),
      value: 2.3456,
    };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);

    //the first time the controller is called, it's all good
    //the second time it raises an error
    (measurementController.storeMeasurement as jest.Mock)
      .mockResolvedValueOnce(undefined) //OK
      .mockRejectedValueOnce(new Error("Internal Server Error")); //INTERNAL SERVER ERROR (it's not exactly a TypeORM database error, but we don't care)
  
    const response = await request(app)
      .post(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/measurements"
      )
      .set("Authorization", token)
      .send([measurement1, measurement2]); //two measurements

      expect(response.status).toBe(500);
      expect(response.body.message).toMatch(/Internal Server Error/);
    });
  

  it("store measurement - 400 Bad Request", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);

    // invalid createdAt type
    const bad1 = [{ createdAt: 12345, value: 1.23 }];
    const res1 = await request(app)
      .post(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/measurements"
      )
      .set("Authorization", token)
      .send(bad1);
    expect(res1.status).toBe(400);

    // invalid value type
    const bad2 = [{ createdAt: new Date("2025-02-18T17:00:00Z"), value: "NaN" }];
    const res2 = await request(app)
      .post(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/measurements"
      )
      .set("Authorization", token)
      .send(bad2);
    expect(res2.status).toBe(400);
  });

  it("store measurement - 401 Unauthorized", async () => {
    (authService.processToken as jest.Mock).mockRejectedValue(
      new UnauthorizedError("Unauthorized")
    );
    const mocked: MeasurementDTO = {
      createdAt: new Date("2025-02-18T17:00:00Z"),
      value: 1.2345,
    };

    const response = await request(app)
      .post(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/measurements"
      )
      .set("Authorization", token)
      .send([mocked]);

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("store measurement - 403 Insufficient rights", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.storeMeasurement as jest.Mock).mockRejectedValue(
      new InsufficientRightsError("Insufficient rights")
    );

    const mocked: MeasurementDTO = {
      createdAt: new Date("2025-02-18T17:00:00Z"),
      value: 1.2345,
    };

    const response = await request(app)
      .post(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/measurements"
      )
      .set("Authorization", token)
      .send([mocked]);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });

  it("store measurement - 404 Not Found", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.storeMeasurement as jest.Mock).mockRejectedValue(
      new NotFoundError("Entity not found")
    );

    const mocked: MeasurementDTO = {
      createdAt: new Date("2025-02-18T17:00:00Z"),
      value: 1.2345,
    };

    const response = await request(app)
      .post(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/measurements"
      )
      .set("Authorization", token)
      .send([mocked]);

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/);
  });

  //
  // GET /…/sensors/:sensorMac/measurements
  //
  it("get measurements for a sensor - 200 OK", async () => {
    const mockedList: MeasurementsListDTO = {
      sensorMacAddress: "00:00:00:00:00:01",
      measurements: [
        { createdAt: new Date("2025-02-18T17:00:00Z"), value: 1.23 },
      ],
      stats: undefined,
    };

    const responseJson = MeasurementsToJSONTyped(mockedList, false);
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.getMeasurementsBySensor as jest.Mock).mockResolvedValue(
      mockedList
    );

    const response = await request(app)
      .get(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/measurements"
      )
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(responseJson);
    expect(measurementController.getMeasurementsBySensor).toHaveBeenCalledWith(
      "00:00:00:00:00:01",
      "00:00:00:00:00:03",
      "NET01",
      false,    // includeOutliers default
      undefined,
      undefined
    );
  });

  it("get measurements for a sensor - 401 Unauthorized", async () => {
    (authService.processToken as jest.Mock).mockRejectedValue(
      new UnauthorizedError("Unauthorized")
    );

    const response = await request(app)
      .get(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/measurements"
      )
      .set("Authorization", token);

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("get measurements for a sensor - 404 Not Found", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.getMeasurementsBySensor as jest.Mock).mockRejectedValue(
      new NotFoundError("Entity not found")
    );

    const response = await request(app)
      .get(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/measurements"
      )
      .set("Authorization", token);

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/);
  });

  //
  // GET /…/sensors/:sensorMac/stats
  //
  it("get stats for a sensor - 200 OK", async () => {
    const mockedStats: StatsDTO = {
      startDate: new Date("2025-02-18T15:00:00Z"),
      endDate: new Date("2025-02-18T17:00:00Z"),
      mean: 23.45,
      variance: 7.56,
      upperThreshold: 28.95,
      lowerThreshold: 17.95,
    };

    const responseJson = StatsToJSON(mockedStats);

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.getStatsBySensor as jest.Mock).mockResolvedValue(
      mockedStats
    );

    const response = await request(app)
      .get(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/stats"
      )
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(responseJson);
    expect(measurementController.getStatsBySensor).toHaveBeenCalledWith(
      "00:00:00:00:00:01",
      "00:00:00:00:00:03",
      "NET01",
      undefined,
      undefined
    );
  });

  it("get stats for a sensor - 401 Unauthorized", async () => {
    (authService.processToken as jest.Mock).mockRejectedValue(
      new UnauthorizedError("Unauthorized")
    );

    const response = await request(app)
      .get(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/stats"
      )
      .set("Authorization", token);

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("get stats for a sensor - 404 Not Found", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.getStatsBySensor as jest.Mock).mockRejectedValue(
      new NotFoundError("Entity not found")
    );

    const response = await request(app)
      .get(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/stats"
      )
      .set("Authorization", token);

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/);
  });

  //
  // GET /…/sensors/:sensorMac/outliers
  //
  it("get outliers for a sensor - 200 OK", async () => {
    const mocked: MeasurementsListDTO = {
      sensorMacAddress: "00:00:00:00:00:01",
      measurements: [
        {
          createdAt: new Date("2025-02-18T16:00:00Z"),
          value: 42.0,
          isOutlier: true,
        },
      ],
      stats: undefined,
    };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.getMeasurementsBySensor as jest.Mock).mockResolvedValue(
      mocked
    );

    const response = await request(app)
      .get(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/outliers"
      )
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mocked);
    expect(measurementController.getMeasurementsBySensor).toHaveBeenCalledWith(
      "00:00:00:00:00:01",
      "00:00:00:00:00:03",
      "NET01",
      true,
      undefined,
      undefined
    );
  });

  it("get outliers for a sensor - 401 Unauthorized", async () => {
    (authService.processToken as jest.Mock).mockRejectedValue(
      new UnauthorizedError("Unauthorized")
    );

    const response = await request(app)
      .get(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/outliers"
      )
      .set("Authorization", token);

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("get outliers for a sensor - 404 Not Found", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.getMeasurementsBySensor as jest.Mock).mockRejectedValue(
      new NotFoundError("Entity not found")
    );

    const response = await request(app)
      .get(
        "/api/v1/networks/NET01/gateways/00:00:00:00:00:03/sensors/00:00:00:00:00:01/outliers"
      )
      .set("Authorization", token);

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/);
  });

  //
  // GET /networks/:networkCode/measurements
  //
  it("get measurements for a network - 200 OK", async () => {
    const mockedList: MeasurementsListDTO[] = [
      { sensorMacAddress: "00:00:00:00:00:01", measurements: [], stats: undefined },
    ];

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.getMeasurementsByNetwork as jest.Mock).mockResolvedValue(
      mockedList
    );

    const response = await request(app)
      .get("/api/v1/networks/NET01/measurements")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockedList);
    expect(measurementController.getMeasurementsByNetwork).toHaveBeenCalledWith(
      "NET01",
      false,
      undefined,
      undefined,
      undefined
    );
  });

  it("get measurements for a network - 401 Unauthorized", async () => {
    (authService.processToken as jest.Mock).mockRejectedValue(
      new UnauthorizedError("Unauthorized")
    );

    const response = await request(app)
      .get("/api/v1/networks/NET01/measurements")
      .set("Authorization", token);

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("get measurements for a network - 404 Not Found", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.getMeasurementsByNetwork as jest.Mock).mockRejectedValue(
      new NotFoundError("Entity not found")
    );

    const response = await request(app)
      .get("/api/v1/networks/NET01/measurements")
      .set("Authorization", token);

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/);
  });

  //
  // GET /networks/:networkCode/stats
  //
  it("get stats for a network - 200 OK", async () => {
    const mockedStats: StatsDTO = {
        startDate: new Date("2025-02-18T15:00:00Z"),
        endDate: new Date("2025-02-18T17:00:00Z"),
        mean: 10,
        variance: 2,
        upperThreshold: 12,
        lowerThreshold: 8,
      };
    const mockedMeasurementsDTOs: MeasurementsListDTO[] = [
      {
        sensorMacAddress: "AA:AA:AA:AA:AA:01", 
        stats: mockedStats,
      },
    ];

    // Convert mockedMeasurementsDTOs to the expected JSON format to mock the response.json(..) in routes
    const expectedBodyArray = mockedMeasurementsDTOs.map(m =>
      MeasurementsToJSONTyped(m, false)
    );
    const responseJson = JSON.parse(JSON.stringify(expectedBodyArray));
    
    console.log("responseJson: ", responseJson);

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.getStatsbyNetwork as jest.Mock).mockResolvedValue(
      mockedMeasurementsDTOs
    );

    const response = await request(app)
      .get("/api/v1/networks/NET01/stats")
      .set("Authorization", token)
      //add query params
      //.query({ startDate: "2025-02-18T15:00:00Z", endDate: "2025-02-18T17:00:00Z" });

    console.log("response: ", response.body);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject(responseJson);
    expect(measurementController.getStatsbyNetwork).toHaveBeenCalledWith(
      "NET01",
      undefined,
      undefined,
      undefined
    );
  });

  it("get stats for a network - 401 Unauthorized", async () => {
    (authService.processToken as jest.Mock).mockRejectedValue(
      new UnauthorizedError("Unauthorized")
    );

    const response = await request(app)
      .get("/api/v1/networks/NET01/stats")
      .set("Authorization", token);

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("get stats for a network - 404 Not Found", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.getStatsbyNetwork as jest.Mock).mockRejectedValue(
      new NotFoundError("Entity not found")
    );

    const response = await request(app)
      .get("/api/v1/networks/NET01/stats")
      .set("Authorization", token);

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/);
  });

 
  //
  // GET /networks/:networkCode/outliers
  //
  it("get outliers for a network - 200 OK", async () => {
    const mockedList: MeasurementsListDTO[] = [
      {
        sensorMacAddress: "00:00:00:00:00:01",
        stats: {
          startDate: new Date("2025-02-18T15:00:00Z"),
          endDate: new Date("2025-02-18T17:00:00Z"),
          mean: 10,
          variance: 2,
          upperThreshold: 12,
          lowerThreshold: 8,
        },
        measurements: [
          {
            createdAt: new Date("2025-02-18T16:00:00Z"),
            value: 42.0,
            isOutlier: true,
          },
        ],
      },
    ];

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.getMeasurementsByNetwork as jest.Mock).mockResolvedValue(
      mockedList
    );


    const responseBody = mockedList.map(m => 
      MeasurementsToJSONTyped(m, true)
    );

    const responseJson = JSON.parse(JSON.stringify(responseBody));

    const response = await request(app)
      .get("/api/v1/networks/NET01/outliers")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(responseJson);
    expect(measurementController.getMeasurementsByNetwork).toHaveBeenCalledWith(
      "NET01",
      true,
      undefined,
      undefined,
      undefined
    );
  });


  it("get outliers for a network - 401 Unauthorized", async () => {
    (authService.processToken as jest.Mock).mockRejectedValue(
      new UnauthorizedError("Unauthorized")
    );

    const response = await request(app)
      .get("/api/v1/networks/NET01/outliers")
      .set("Authorization", token);

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("get outliers for a network - 404 Not Found", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (measurementController.getMeasurementsByNetwork as jest.Mock).mockRejectedValue(
      new NotFoundError("Entity not found")
    );

    const response = await request(app)
      .get("/api/v1/networks/NET01/outliers")
      .set("Authorization", token);

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/);
  });

  it("GET sensor measurements con startDate e endDate - 200", async () => {
    const start = "2025-02-01T00:00:00Z";
    const end   = "2025-02-02T00:00:00Z";
    (measurementController.getMeasurementsBySensor as jest.Mock)
      .mockResolvedValue({ sensorMacAddress: "00:01", measurements: [], stats: undefined });

    const res = await request(app)
      .get("/api/v1/networks/NET01/gateways/G1/sensors/S1/measurements")
      .query({ startDate: start, endDate: end })
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(measurementController.getMeasurementsBySensor).toHaveBeenCalledWith(
      "S1", "G1", "NET01", false, new Date(start), new Date(end)
    );
  });

   it("GET network measurements con sensorMacs array - 200", async () => {
    const mocks: MeasurementsListDTO[] = [{ sensorMacAddress: "S1", measurements: [], stats: undefined }];
    (measurementController.getMeasurementsByNetwork as jest.Mock).mockResolvedValue(mocks);

    const res = await request(app)
      .get("/api/v1/networks/NET01/measurements")
      .query({ sensorMacs: ["S1","S2"], startDate: "2025-02-01T00:00:00Z" })
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(measurementController.getMeasurementsByNetwork).toHaveBeenCalledWith(
      "NET01", false, ["S1","S2"], new Date("2025-02-01T00:00:00Z"), undefined
    );
    expect(res.body).toEqual(mocks);
  });


  it("GET network stats con sensorMacs CSV - 200", async () => {
    
    //mock the measurements DTO
    const measurementsDTOMock: MeasurementsListDTO[] = [
      {
        sensorMacAddress: "S1",
        stats: {
          startDate: new Date("2025-02-01T00:00:00Z"),
          endDate: new Date("2025-02-02T00:00:00Z"),
          mean: 10,
          variance: 2,
          upperThreshold: 12,
          lowerThreshold: 8,
        },
      },
      {
        sensorMacAddress: "S2",
        stats: {
          startDate: new Date("2025-02-01T00:00:00Z"),
          endDate: new Date("2025-02-02T00:00:00Z"),
          mean: 15,
          variance: 3,
          upperThreshold: 18,
          lowerThreshold: 12,
        },
      },
    ];
    (measurementController.getStatsbyNetwork as jest.Mock).mockResolvedValue(measurementsDTOMock);

    const responseBody = measurementsDTOMock.map(m => 
      MeasurementsToJSONTyped(m, false)
    );

    const responseJson = JSON.parse(JSON.stringify(responseBody));

    const res = await request(app)
      .get("/api/v1/networks/NET01/stats")
      .query({ sensorMacs: "S1,S2" })
      .set("Authorization", token);

    console.log("response: ", res.body);
    expect(res.status).toBe(200);
    expect(measurementController.getStatsbyNetwork).toHaveBeenCalledWith(
      "NET01", ["S1","S2"], undefined, undefined
    );
    expect(res.body).toEqual(responseJson);
  });




  it("GET netwot stats - Unauthorized - 401", async () => {
    (authService.processToken as jest.Mock).mockRejectedValue(
      new UnauthorizedError("Unauthorized")
    );
    const response = await request(app)
      .get("/api/v1/networks/NET01/stats")
      .set("Authorization", token);
    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("get stats for a sensor con startDate e endDate - 200 OK", async () => {
  const start = "2025-02-18T00:00:00Z";
  const end   = "2025-02-19T00:00:00Z";
  const mockedStats: StatsDTO = {
    startDate: new Date(start),
    endDate: new Date(end),
    mean: 5,
    variance: 1,
    upperThreshold: 6,
    lowerThreshold: 4,
  };

  (authService.processToken as jest.Mock).mockResolvedValue(undefined);
  (measurementController.getStatsBySensor as jest.Mock).mockResolvedValue(mockedStats);
  
  //the utils function to parse dates is expected to return this:
  const parsedStart = parseISO(decodeURIComponent(start));
  const parsedEnd = parseISO(decodeURIComponent(end));

  //convert the mockedStats to the expected JSON format, mock the response.json(..) in routes
  const responseBody = StatsToJSON(mockedStats);
  const responseJson = JSON.parse(JSON.stringify(responseBody));

  const response = await request(app)
    .get("/api/v1/networks/NET01/gateways/G1/sensors/S1/stats")
    .query({ startDate: start, endDate: end })
    .set("Authorization", token);

  expect(response.status).toBe(200);
  expect(measurementController.getStatsBySensor).toHaveBeenCalledWith(
    "S1", "G1", "NET01", new Date(parsedStart.getTime()), new Date(parsedEnd.getTime())
  );
  expect(response.body).toEqual(responseJson);
});

it("get outliers for a sensor con startDate e endDate - 200 OK", async () => {
  const start = "2025-02-18T00:00:00Z";
  const end   = "2025-02-19T00:00:00Z";
  const mockedList: MeasurementsListDTO = {
    sensorMacAddress: "S1",
    measurements: [
      { createdAt: new Date(start), value: 42, isOutlier: true },
    ],
    stats: undefined,
  };

  (authService.processToken as jest.Mock).mockResolvedValue(undefined);
  (measurementController.getMeasurementsBySensor as jest.Mock).mockResolvedValue(mockedList);
  //the utils function to parse dates is expected to return this:
  const parsedStart = parseISO(decodeURIComponent(start));
  const parsedEnd = parseISO(decodeURIComponent(end));

  const response = await request(app)
    .get("/api/v1/networks/NET01/gateways/G1/sensors/S1/outliers")
    .query({ startDate: start, endDate: end })
    .set("Authorization", token);

  expect(response.status).toBe(200);
  expect(measurementController.getMeasurementsBySensor).toHaveBeenCalledWith(
    "S1", "G1", "NET01", true, new Date(parsedStart.getTime()), new Date(parsedEnd.getTime())
  );
  expect(response.body).toEqual(mockedList);
});

it("get outliers for a sensor con startDate e endDate - 400 Bad Request", async () => {
  const start = 12345; //invalid date
  const end   = "2025-02-19T00:00:00Z";
  (authService.processToken as jest.Mock).mockResolvedValue(undefined);
  
  const response = await request(app)
    .get("/api/v1/networks/NET01/gateways/G1/sensors/S1/outliers")
    .query({ startDate: start, endDate: end })
    .set("Authorization", token);

  expect(response.status).toBe(400);
  expect(response.body.message).toBeDefined;
});

it("get outliers - 401 Unauthorized", async () => {
  (authService.processToken as jest.Mock).mockRejectedValue(
    new UnauthorizedError("Unauthorized")
  );
  const response = await request(app)
    .get("/api/v1/networks/NET01/gateways/G1/sensors/S1/outliers")
    .set("Authorization", token);
  expect(response.status).toBe(401);
  expect(response.body.message).toMatch(/Unauthorized/);
});


it("get measurements for a network con sensorMacs CSV - 200 OK", async () => {
  const mocks: MeasurementsListDTO[] = [
    { sensorMacAddress: "S1", measurements: [], stats: undefined },
    { sensorMacAddress: "S2", measurements: [], stats: undefined },
  ];

  (authService.processToken as jest.Mock).mockResolvedValue(undefined);
  (measurementController.getMeasurementsByNetwork as jest.Mock).mockResolvedValue(mocks);

  const response = await request(app)
    .get("/api/v1/networks/NET01/measurements")
    .query({ sensorMacs: "S1,S2" })
    .set("Authorization", token);

  expect(response.status).toBe(200);
  expect(measurementController.getMeasurementsByNetwork).toHaveBeenCalledWith(
    "NET01", false, ["S1", "S2"], undefined, undefined
  );
});


it("get measurements for a network con startDate e endDate - 200 OK", async () => {
  const start = "2025-02-18T00:00:00Z";
  const end   = "2025-02-19T00:00:00Z";
  const mocks: MeasurementsListDTO[] = [
    { sensorMacAddress: "S1", measurements: [], stats: undefined },
  ];

  (authService.processToken as jest.Mock).mockResolvedValue(undefined);
  (measurementController.getMeasurementsByNetwork as jest.Mock).mockResolvedValue(mocks);

  //the utils function to parse dates is expected to return this:
  const parsedStart = parseISO(decodeURIComponent(start));
  const parsedEnd = parseISO(decodeURIComponent(end));

  const response = await request(app)
    .get("/api/v1/networks/NET01/measurements")
    .query({ startDate: start, endDate: end })
    .set("Authorization", token);

  expect(response.status).toBe(200);
  expect(measurementController.getMeasurementsByNetwork).toHaveBeenCalledWith(
    "NET01", false, undefined, new Date(parsedStart.getTime()), new Date(parsedEnd.getTime())
  );
});

it("get measurements for a network - 400 Bad Request", async () => {
  const start = 12345; //invalid date
  (authService.processToken as jest.Mock).mockResolvedValue(undefined);
  const response = await request(app)
    .get("/api/v1/networks/NET01/measurements")
    .query({ startDate: start })
    .set("Authorization", token);
  expect(response.status).toBe(400);
  expect(response.body.message).toBeDefined();
});

it("get measurements for a network - 401 Unauthorized", async () => {
  (authService.processToken as jest.Mock).mockRejectedValue(
    new UnauthorizedError("Unauthorized")
  );
  const response = await request(app)
    .get("/api/v1/networks/NET01/measurements")
    .set("Authorization", token);
  expect(response.status).toBe(401);
  expect(response.body.message).toMatch(/Unauthorized/);
});

it("get stats for a network con sensorMacs array - 200 OK", async () => {
  const measurementsDTOMock: MeasurementsListDTO[] = [
    {
      sensorMacAddress: "S1",
      measurements: [],
      stats: {
        startDate: new Date("2025-02-01T00:00:00Z"),
        endDate: new Date("2025-02-02T00:00:00Z"),
        mean: 10,
        variance: 2,
        upperThreshold: 12,
        lowerThreshold: 8,
      },
    },
    {
      sensorMacAddress: "S2",
      measurements: [],
      stats: {
        startDate: new Date("2025-02-01T00:00:00Z"),
        endDate: new Date("2025-02-02T00:00:00Z"),
        mean: 15,
        variance: 3,
        upperThreshold: 18,
        lowerThreshold: 12,
      },
    },
  ];

  (authService.processToken as jest.Mock).mockResolvedValue(undefined);
  (measurementController.getStatsbyNetwork as jest.Mock).mockResolvedValue(measurementsDTOMock);

  const responseBody = measurementsDTOMock.map(m =>
    MeasurementsToJSONTyped(m, false)
  );  
  const responseJson = JSON.parse(JSON.stringify(responseBody));

  const response = await request(app)
    .get("/api/v1/networks/NET01/stats")
    .query({ sensorMacs: ["S1", "S2"] })
    .set("Authorization", token);

  console.log("response: ", response.body);
  expect(response.status).toBe(200);
  expect(measurementController.getStatsbyNetwork).toHaveBeenCalledWith(
    "NET01", ["S1", "S2"], undefined, undefined
  );
  expect(response.body).toEqual(responseJson);
});


it("get stats for a network con startDate e endDate - 200 OK", async () => {
  const start = "2025-02-18T00:00:00Z";
  const end   = "2025-02-19T00:00:00Z";
  const measurementsDTOMock: MeasurementsListDTO[] = [
    {
      sensorMacAddress: "S1",
      stats: {
        startDate: new Date(start),
        endDate: new Date(end),
        mean: 5,
        variance: 1,
        upperThreshold: 6,
        lowerThreshold: 4,
      },
    },
  ];

  (authService.processToken as jest.Mock).mockResolvedValue(undefined);
  (measurementController.getStatsbyNetwork as jest.Mock).mockResolvedValue(measurementsDTOMock);

  const response = await request(app)
    .get("/api/v1/networks/NET01/stats")
    .query({ startDate: start, endDate: end })
    .set("Authorization", token);

  expect(response.status).toBe(200);
  expect(measurementController.getStatsbyNetwork).toHaveBeenCalledWith(
    "NET01", undefined, new Date(start), new Date(end)
  );
});

it("get stats for a network - 400 Bad Request", async () => {
  const end = 12345; //invalid date
  (authService.processToken as jest.Mock).mockResolvedValue(undefined);
  const response = await request(app)
    .get("/api/v1/networks/NET01/stats")
    .query({ endDate: end })
    .set("Authorization", token);
  expect(response.status).toBe(400);
  expect(response.body.message).toBeDefined();
});

it("get stats for a network - 401 Unauthorized", async () => {
  (authService.processToken as jest.Mock).mockRejectedValue(
    new UnauthorizedError("Unauthorized")
  );
  const response = await request(app)
    .get("/api/v1/networks/NET01/stats")
    .set("Authorization", token);
  expect(response.status).toBe(401);
  expect(response.body.message).toMatch(/Unauthorized/);
});

it("get outliers for a network con sensorMacs array - 200 OK", async () => {
  const mockedList: MeasurementsListDTO[] = [
    { sensorMacAddress: "S1", measurements: [{ createdAt: new Date(), value: 1, isOutlier: true }], stats: undefined },
  ];

  (authService.processToken as jest.Mock).mockResolvedValue(undefined);
  (measurementController.getMeasurementsByNetwork as jest.Mock).mockResolvedValue(mockedList);

  const response = await request(app)
    .get("/api/v1/networks/NET01/outliers")
    .query({ sensorMacs: ["S1", "S2"] })
    .set("Authorization", token);

  expect(response.status).toBe(200);
  expect(measurementController.getMeasurementsByNetwork).toHaveBeenCalledWith(
    "NET01", true, ["S1", "S2"], undefined, undefined
  );
});

it("get outliers for a network con sensorMacs CSV - 200 OK", async () => {
  const mockedList: MeasurementsListDTO[] = [
    { sensorMacAddress: "S1", measurements: [{ createdAt: new Date(), value: 1, isOutlier: true }], stats: undefined },
  ];

  (authService.processToken as jest.Mock).mockResolvedValue(undefined);
  (measurementController.getMeasurementsByNetwork as jest.Mock).mockResolvedValue(mockedList);

  const response = await request(app)
    .get("/api/v1/networks/NET01/outliers")
    .query({ sensorMacs: "S1,S2" })
    .set("Authorization", token);

  expect(response.status).toBe(200);
  expect(measurementController.getMeasurementsByNetwork).toHaveBeenCalledWith(
    "NET01", true, ["S1", "S2"], undefined, undefined
  );
});

it("get outliers for a network con startDate e endDate - 200 OK", async () => {
  const start = "2025-02-18T00:00:00Z";
  const end   = "2025-02-19T00:00:00Z";
  const mockedList: MeasurementsListDTO[] = [
    { sensorMacAddress: "S1", measurements: [{ createdAt: new Date(start), value: 1, isOutlier: true }], stats: undefined },
  ];

  (authService.processToken as jest.Mock).mockResolvedValue(undefined);
  (measurementController.getMeasurementsByNetwork as jest.Mock).mockResolvedValue(mockedList);

  const response = await request(app)
    .get("/api/v1/networks/NET01/outliers")
    .query({ startDate: start, endDate: end })
    .set("Authorization", token);

  expect(response.status).toBe(200);
  expect(measurementController.getMeasurementsByNetwork).toHaveBeenCalledWith(
    "NET01", true, undefined, new Date(start), new Date(end)
  );
});

it("get outliers for a network - 400 Bad Request", async () => {
  const start = 12345; //invalid date
  (authService.processToken as jest.Mock).mockResolvedValue(undefined);
  
  const response = await request(app)
    .get("/api/v1/networks/NET01/outliers")
    .query({ startDate: start })
    .set("Authorization", token);

  expect(response.status).toBe(400);
  expect(response.body.message).toBeDefined();
});

it("get outliers for a network - 401 Unauthorized", async () => {
  (authService.processToken as jest.Mock).mockRejectedValue(
    new UnauthorizedError("Unauthorized")
  );

  const response = await request(app)
    .get("/api/v1/networks/NET01/outliers")
    .set("Authorization", token);

  expect(response.status).toBe(401);
  expect(response.body.message).toMatch(/Unauthorized/);
});


});
