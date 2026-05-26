import { Module } from '@nestjs/common';
import { ComandasController } from './comandas.controller';
import { ComandasService } from './comandas.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports:     [PrismaModule],
  controllers: [ComandasController],
  providers:   [ComandasService],
  exports:     [ComandasService],
})
export class ComandasModule {}
