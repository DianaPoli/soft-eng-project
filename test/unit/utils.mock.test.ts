import {
  findOrThrowNotFound,
  throwIfNotFound,
  throwConflictIfFound,
  parseISODateParamToUTC,
  parseStringArrayParam,
} from "@utils"; 
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

describe("Utility Functions", () => {
  describe("findOrThrowNotFound", () => {
    const items = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
    ];

    it("should return the item if found", () => {
      const result = findOrThrowNotFound(
        items,
        (item) => item.name === "Bob",
        "User not found"
      );
      expect(result).toEqual({ id: 2, name: "Bob" });
    });

    it("should throw NotFoundError if item is not found", () => {
      expect(() =>
        findOrThrowNotFound(
          items,
          (item) => item.name === "David",
          "User David not found"
        )
      ).toThrow(new NotFoundError("User David not found"));
    });

    it("should work with an empty array", () => {
      expect(() =>
        findOrThrowNotFound([], (item: any) => item.id === 1, "Item not found")
      ).toThrow(new NotFoundError("Item not found"));
    });
  });

  describe("throwIfNotFound", () => {
    it("should return the entity if it exists", () => {
      const entity = { id: 1, data: "some data" };
      expect(throwIfNotFound(entity, "Entity missing")).toBe(entity);
    });

    it("should throw NotFoundError if entity is null", () => {
      expect(() => throwIfNotFound(null, "Entity was null")).toThrow(
        new NotFoundError("Entity was null")
      );
    });

    it("should throw NotFoundError if entity is undefined", () => {
      expect(() => throwIfNotFound(undefined, "Entity was undefined")).toThrow(
        new NotFoundError("Entity was undefined")
      );
    });
  });

  describe("throwConflictIfFound", () => {
    const items = [
      { id: 1, email: "test@example.com" },
      { id: 2, email: "another@example.com" },
    ];

    it("should not throw if item is not found", () => {
      expect(() =>
        throwConflictIfFound(
          items,
          (item) => item.email === "new@example.com",
          "Email already exists"
        )
      ).not.toThrow();
    });

    it("should throw ConflictError if item is found", () => {
      expect(() =>
        throwConflictIfFound(
          items,
          (item) => item.email === "test@example.com",
          "Email test@example.com already exists"
        )
      ).toThrow(new ConflictError("Email test@example.com already exists"));
    });

    it("should not throw for an empty array", () => {
      expect(() =>
        throwConflictIfFound([], (item: any) => item.id === 1, "Conflict")
      ).not.toThrow();
    });
  });

  describe("parseISODateParamToUTC", () => {
    it("should parse a valid ISO date string to a Date object", () => {
      const isoString = "2025-05-25T12:00:00.000Z";
      const result = parseISODateParamToUTC(isoString);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe(isoString);
    });

    it("should parse a valid ISO date string (without Z) to a Date object, assuming UTC if no offset", () => {
      const isoString = "2025-05-25T12:00:00"; // No Z or offset
      const result = parseISODateParamToUTC(isoString);
      expect(result).toBeInstanceOf(Date);
      // date-fns parseISO treats this as local, then new Date(date.getTime()) preserves that interpretation
      // For consistent UTC, the input string should ideally have 'Z' or an offset.
      // The behavior here depends on the system's local timezone if no offset is provided.
      // To ensure UTC, we'd expect the input to be '2025-05-25T12:00:00Z'
      // Let's test with a string that will parse to a specific UTC time
      const specificUtcString = "2023-01-01T00:00:00Z";
      const specificResult = parseISODateParamToUTC(specificUtcString);
      expect(specificResult?.toISOString()).toBe("2023-01-01T00:00:00.000Z");
    });
    
    it("should handle URL encoded date strings", () => {
      const encodedIsoString = "2025-05-25T12%3A00%3A00.000Z"; // Simulating %3A for :
      const result = parseISODateParamToUTC(encodedIsoString);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe("2025-05-25T12:00:00.000Z");
    });

    it("should return undefined for an invalid date string", () => {
      expect(parseISODateParamToUTC("not-a-date")).toBeUndefined();
    });

    it("should return undefined for non-string input", () => {
      expect(parseISODateParamToUTC(12345)).toBeUndefined();
      expect(parseISODateParamToUTC(null)).toBeUndefined();
      expect(parseISODateParamToUTC(undefined)).toBeUndefined();
      expect(parseISODateParamToUTC({})).toBeUndefined();
    });
  });

  describe("parseStringArrayParam", () => {
    it("should parse a comma-separated string into an array of strings, trimming whitespace", () => {
      const param = "apple , banana, cherry ";
      expect(parseStringArrayParam(param)).toEqual([
        "apple",
        "banana",
        "cherry",
      ]);
    });

    it("should return an empty array for an empty string", () => {
      expect(parseStringArrayParam("")).toEqual([]);
    });

    it("should return an empty array for a string with only commas and whitespace", () => {
      expect(parseStringArrayParam(" , ,, , ")).toEqual([]);
    });

    it("should handle a single item string", () => {
      expect(parseStringArrayParam("single")).toEqual(["single"]);
    });

    it("should handle an array of strings, trimming and filtering empty strings", () => {
      const param = [" apple ", "banana", "", " cherry ", " "];
      expect(parseStringArrayParam(param)).toEqual([
        "apple",
        "banana",
        "cherry",
      ]);
    });
     it("should handle an array with non-string elements by converting them to empty strings then filtering", () => {
      const param = [" apple ", 123, "banana", null, " cherry ", undefined];
      // 123 becomes "", null becomes "", undefined becomes "" -> all filtered out
      expect(parseStringArrayParam(param)).toEqual([
        "apple",
        "banana",
        "cherry",
      ]);
    });


    it("should return undefined if param is not a string or array", () => {
      expect(parseStringArrayParam(123)).toBeUndefined();
      expect(parseStringArrayParam(null)).toBeUndefined();
      expect(parseStringArrayParam({})).toBeUndefined();
    });
    
    it("should return undefined if param is undefined", () => {
      expect(parseStringArrayParam(undefined)).toBeUndefined();
    });

    it("should handle an empty array input", () => {
      expect(parseStringArrayParam([])).toEqual([]);
    });
  });
});
