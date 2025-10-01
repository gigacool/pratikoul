import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../entities/user.entity';
import { UserRepository } from '../../infrastructure/persistence/user.repository';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.userRepository.findAll();
    return users.map(this.excludePassword);
  }

  async findById(uuid: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findById(uuid);
    if (!user) {
      throw new NotFoundException(`User with uuid ${uuid} not found`);
    }
    return this.excludePassword(user);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findByEmail(email);
  }

  async create(email: string, password: string, role: UserRole, name?: string): Promise<Omit<User, 'passwordHash'>> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User(
      uuidv4(),
      email,
      passwordHash,
      role,
      name,
      new Date().toISOString(),
      new Date().toISOString(),
    );

    const createdUser = await this.userRepository.create(user);
    return this.excludePassword(createdUser);
  }

  async update(uuid: string, data: { email?: string; password?: string; role?: UserRole; name?: string }): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findById(uuid);
    if (!user) {
      throw new NotFoundException(`User with uuid ${uuid} not found`);
    }

    // If email is being changed, check for conflicts
    if (data.email && data.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    const updateData: Partial<User> = {};

    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await this.userRepository.update(uuid, updateData);
    return this.excludePassword(updatedUser);
  }

  async delete(uuid: string): Promise<void> {
    const user = await this.userRepository.findById(uuid);
    if (!user) {
      throw new NotFoundException(`User with uuid ${uuid} not found`);
    }
    await this.userRepository.delete(uuid);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  private excludePassword(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
