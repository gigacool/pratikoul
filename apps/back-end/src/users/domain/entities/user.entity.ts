import { UserRole } from '../enums/user-role.enum';

export class User {
  constructor(
    public readonly uuid: string,
    public email: string,
    public passwordHash: string,
    public role: UserRole,
    public name?: string,
    public readonly createdAt: string = new Date().toISOString(),
    public updatedAt: string = new Date().toISOString(),
  ) {}
}
