import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './domain/services/user.service';
import { UserRepository } from './infrastructure/persistence/user.repository';

@Module({
  controllers: [UsersController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UsersModule {}
