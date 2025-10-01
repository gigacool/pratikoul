import { User } from '../entities/user.entity';

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(uuid: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  create(user: User): Promise<User>;
  update(uuid: string, user: Partial<User>): Promise<User>;
  delete(uuid: string): Promise<void>;
}
