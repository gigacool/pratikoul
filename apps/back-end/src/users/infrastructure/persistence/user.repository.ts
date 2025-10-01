import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  private readonly filePath = join(process.cwd(), '.data', 'users.json');

  private async readData(): Promise<User[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  private async writeData(users: User[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(users, null, 2));
  }

  async findAll(): Promise<User[]> {
    return this.readData();
  }

  async findById(uuid: string): Promise<User | undefined> {
    const users = await this.readData();
    return users.find((u) => u.uuid === uuid);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const users = await this.readData();
    return users.find((u) => u.email === email);
  }

  async create(user: User): Promise<User> {
    const users = await this.readData();
    users.push(user);
    await this.writeData(users);
    return user;
  }

  async update(uuid: string, userData: Partial<User>): Promise<User> {
    const users = await this.readData();
    const index = users.findIndex((u) => u.uuid === uuid);

    if (index === -1) {
      throw new Error(`User with uuid ${uuid} not found`);
    }

    users[index] = {
      ...users[index],
      ...userData,
      uuid: users[index].uuid, // Prevent UUID from being changed
      createdAt: users[index].createdAt, // Prevent createdAt from being changed
      updatedAt: new Date().toISOString(),
    };

    await this.writeData(users);
    return users[index];
  }

  async delete(uuid: string): Promise<void> {
    const users = await this.readData();
    const filtered = users.filter((u) => u.uuid !== uuid);

    if (filtered.length === users.length) {
      throw new Error(`User with uuid ${uuid} not found`);
    }

    await this.writeData(filtered);
  }
}
