import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.active) {
      throw new UnauthorizedException(
        'Usuário inativo. Contate o administrador',
      );
    }

    const passwordMatch = await bcrypt.compare(
      dto.password,
      user.password,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  async loginByPin(pin: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        pin,
        active: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('PIN inválido');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: {
        token: refreshToken,
      },
      include: {
        user: true,
      },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Token expirado. Faça login novamente',
      );
    }

    await this.prisma.refreshToken.delete({
      where: {
        id: tokenRecord.id,
      },
    });

    return this.generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.email,
      tokenRecord.user.role,
    );
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
    });

    return {
      message: 'Logout realizado com sucesso',
    };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        active: true,
        createdAt: true,
      },
    });
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ) {
    const accessPayload = {
      sub: userId,
      email,
      role,
      type: 'access',
    };

    const refreshPayload = {
      sub: userId,
      email,
      role,
      type: 'refresh',
      jti: crypto.randomUUID(),
    };

    const accessToken = this.jwt.sign(accessPayload, {
      secret: this.config.get<string>('JWT_SECRET') || 'dev-secret',
      expiresIn:
        this.config.get<string>('JWT_EXPIRES_IN') || '7d',
    });

    const refreshToken = this.jwt.sign(refreshPayload, {
      secret:
        this.config.get<string>('JWT_REFRESH_SECRET') ||
        this.config.get<string>('JWT_SECRET') ||
        'dev-refresh-secret',
      expiresIn: '30d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}