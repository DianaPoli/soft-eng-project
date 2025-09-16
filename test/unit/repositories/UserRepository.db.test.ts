import { UserRepository } from "@repositories/UserRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { UserType } from "@models/UserType";
import { UserDAO } from "@dao/UserDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(UserDAO).clear();
});

describe("UserRepository: SQLite in-memory", () => {
  const repo = new UserRepository();

  describe("createUser", () => {
    it("should create a new user successfully and return the created user", async () => {
      const user = await repo.createUser("john.doe", "password123", UserType.Admin);
      expect(user).toBeDefined();
      expect(user).toMatchObject({
        username: "john.doe",
        password: "password123", // Passwords are not hashed by this repository layer
        type: UserType.Admin
      });

      // Verify user is actually in the database
      const dbUser = await TestDataSource.getRepository(UserDAO).findOneBy({ username: "john.doe" });
      expect(dbUser).toMatchObject(user);
    });

    it("should throw ConflictError if a user with the same username already exists", async () => {
      await repo.createUser("jane.doe", "securepass", UserType.Viewer);
      await expect(
        repo.createUser("jane.doe", "anotherPass", UserType.Admin)
      ).rejects.toThrow(ConflictError);
      await expect(
        repo.createUser("jane.doe", "yetAnotherPass", UserType.Operator)
      ).rejects.toThrow("User with username 'jane.doe' already exists");
    });
  });

  describe("getUserByUsername", () => {
    it("should return the user if found", async () => {
      const createdUser = await repo.createUser("find.me", "pass", UserType.Operator);
      const foundUser = await repo.getUserByUsername("find.me");
      expect(foundUser).toBeDefined();
      expect(foundUser.username).toEqual("find.me");
      expect(foundUser.type).toEqual(UserType.Operator);
    });

    it("should throw NotFoundError if the user does not exist", async () => {
      await expect(repo.getUserByUsername("ghost.user")).rejects.toThrow(NotFoundError);
      await expect(repo.getUserByUsername("ghost.user")).rejects.toThrow(
        "User with username 'ghost.user' not found"
      );
    });
  });

  describe("getAllUsers", () => {
    it("should return an empty array when no users exist", async () => {
      const users = await repo.getAllUsers();
      expect(users).toEqual([]);
    });

    it("should return all users when users exist", async () => {
      const user1 = await repo.createUser("user.one", "pass1", UserType.Admin);
      const user2 = await repo.createUser("user.two", "pass2", UserType.Viewer);

      const users = await repo.getAllUsers();
      expect(users.length).toBe(2);
      // Use toContainEqual for objects in arrays if order doesn't matter and want to check values
      expect(users).toContainEqual(expect.objectContaining({ username: "user.one"}));
      expect(users).toContainEqual(expect.objectContaining({ username: "user.two"}));
    });
  });

  describe("deleteUser", () => {
    it("should delete an existing user successfully", async () => {
      await repo.createUser("delete.me", "temppass", UserType.Viewer);
      
      // Confirm user exists before deletion
      let userExists = await TestDataSource.getRepository(UserDAO).findOneBy({ username: "delete.me" });
      expect(userExists).not.toBeNull();

      await repo.deleteUser("delete.me");

      // Confirm user no longer exists by trying to fetch
      await expect(repo.getUserByUsername("delete.me")).rejects.toThrow(NotFoundError);
      
      // Also check directly in DB
      userExists = await TestDataSource.getRepository(UserDAO).findOneBy({ username: "delete.me" });
      expect(userExists).toBeNull();
    });

    it("should throw NotFoundError when trying to delete a user that does not exist", async () => {
      await expect(repo.deleteUser("non.existent.user")).rejects.toThrow(NotFoundError);
      await expect(repo.deleteUser("non.existent.user")).rejects.toThrow(
        "User with username 'non.existent.user' not found" // This error comes from the inner getUserByUsername call
      );
    });
  });
});
