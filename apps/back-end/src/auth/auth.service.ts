import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/domain/services/user.service';
import { UserRole } from '../users/domain/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.userService.validatePassword(user, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(user: { uuid: string; email: string; role: string }) {
    const payload = { sub: user.uuid, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { uuid: user.uuid, email: user.email, role: user.role },
    };
  }

  async register(email: string, password: string, name?: string) {
    // New users are registered as 'viewer' role by default
    const user = await this.userService.create(email, password, UserRole.VIEWER, name);

    // Automatically log them in
    return this.login({
      uuid: user.uuid,
      email: user.email,
      role: user.role,
    });
  }
}
