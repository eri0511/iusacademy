import { Module } from '@nestjs/common';

import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import type {
  SignOptions,
} from 'jsonwebtoken';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import {
  JwtAuthGuard,
} from './guards/jwt-auth.guard';

import {
  RolesGuard,
} from './guards/roles.guard';

import {
  JwtStrategy,
} from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,

    PassportModule.register({
      defaultStrategy:
        'jwt',
    }),

    JwtModule.registerAsync({
      imports: [
        ConfigModule,
      ],

      inject: [
        ConfigService,
      ],

      useFactory: (
        configService: ConfigService,
      ) => {
        const jwtSecret =
          configService.getOrThrow<string>(
            'JWT_SECRET',
          );

        const jwtExpiresIn =
          configService.get<string>(
            'JWT_EXPIRES_IN',
          ) ?? '8h';

        return {
          secret:
            jwtSecret,

          signOptions: {
            expiresIn:
              jwtExpiresIn as SignOptions['expiresIn'],
          },
        };
      },
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],

  exports: [
    AuthService,
    JwtModule,
    PassportModule,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}