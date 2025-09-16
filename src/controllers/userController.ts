import { User as UserDTO } from "@dto/User";
import { UserRepository } from "@repositories/UserRepository";
import { mapUserDAOToDTO } from "@services/mapperService";
import { AppError } from "@errors/AppError";

export async function getAllUsers(): Promise<UserDTO[]> {
  const userRepo = new UserRepository();
  return (await userRepo.getAllUsers()).map(mapUserDAOToDTO);
}

export async function getUser(username: string): Promise<UserDTO> {
  const userRepo = new UserRepository();
  return mapUserDAOToDTO(await userRepo.getUserByUsername(username));
}

export async function createUser(userDto: UserDTO): Promise<void> {
  //temporary fix for empty username and password
  //this will be removed once the swagger is corrected, so the openAPI validato can handle this automatically
  if (!userDto.username || !userDto.password) {
    throw new AppError("Username and password cannot be empty", 500);
  } 
  if( userDto.username.length === 0 || userDto.password.length < 5) {
    throw new AppError("Username must be at least 1 character and password at least 5 characters long", 500);
  }

  const userRepo = new UserRepository();
  await userRepo.createUser(userDto.username, userDto.password, userDto.type);
}

export async function deleteUser(username: string): Promise<void> {
  const userRepo = new UserRepository();
  await userRepo.deleteUser(username);
}
