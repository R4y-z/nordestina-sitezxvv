import { Controller, Get, Patch, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Configurações')
@ApiBearerAuth()
@Controller('config')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * GET /config
   * Retorna todas as configurações do sistema (valores salvos + defaults).
   * Acessível para ADMIN.
   */
  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todas as configurações do sistema' })
  findAll() {
    return this.settingsService.findAll();
  }

  /**
   * PATCH /config
   * Atualiza múltiplos pares key/value de uma vez.
   * Body: { configs: [{ key: string, value: string }] }
   */
  @Patch()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar configurações do sistema' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        configs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key:   { type: 'string' },
              value: { type: 'string' },
            },
            required: ['key', 'value'],
          },
        },
      },
      required: ['configs'],
    },
  })
  updateMany(@Body() body: { configs: { key: string; value: string }[] }) {
    const configs = Array.isArray(body?.configs) ? body.configs : [];
    return this.settingsService.updateMany(configs);
  }
}
