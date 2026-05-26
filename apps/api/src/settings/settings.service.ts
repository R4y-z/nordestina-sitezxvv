import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Chaves conhecidas com seus valores padrão
export const DEFAULT_CONFIGS: Record<string, string> = {
  // Estabelecimento
  STORE_NAME:               'Churrascaria Nordestina',
  STORE_PHONE:              '(79) 99807-1169',
  STORE_ADDRESS:            'Estrada Poço Redondo, SE230 - Canindé de São Francisco/SE',
  STORE_CNPJ:               '',
  STORE_EMAIL:              '',
  STORE_HOURS_MON:          '',
  STORE_HOURS_TUE:          '07:00-09:00, 11:50-15:00',
  STORE_HOURS_WED:          '07:00-09:00, 11:50-15:00',
  STORE_HOURS_THU:          '07:00-09:00, 11:50-15:00',
  STORE_HOURS_FRI:          '07:00-09:00, 11:50-15:00',
  STORE_HOURS_SAT:          '07:00-09:00, 11:50-15:00',
  STORE_HOURS_SUN:          '07:00-09:00, 11:50-15:00',

  // Pedidos
  ORDER_MIN_VALUE:          '0',
  ORDER_SERVICE_FEE:        '10',
  ORDER_ACCEPT_ONLINE:      'true',
  KITCHEN_ALERT_MINUTES:    '10',

  // Delivery
  DELIVERY_ENABLED:         'true',
  DELIVERY_MIN_VALUE:       '20',
  DELIVERY_ESTIMATE_MINUTES:'45',
  DELIVERY_RADIUS_KM:       '10',
  DELIVERY_FEE_DEFAULT:     '5',

  // Notificações
  WHATSAPP_ENABLED:         'false',
  WHATSAPP_API_URL:         '',
  NOTIFY_NEW_ORDER:         'true',
  NOTIFY_ORDER_READY:       'true',

  // Fiscal
  NFE_ENABLED:              'false',
  NFE_ENVIRONMENT:          'homologacao',
  FOCUS_NFE_TOKEN:          '',
  NFE_SERIE:                '1',
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // ── Listar todas as configs (merge com defaults) ────────────────────────────
  async findAll(): Promise<{ key: string; value: string; description?: string }[]> {
    const saved = await this.prisma.systemConfig.findMany();
    const savedMap: Record<string, string> = {};
    saved.forEach(c => { savedMap[c.key] = c.value; });

    // Retorna defaults mesclados com valores salvos
    return Object.entries(DEFAULT_CONFIGS).map(([key, defaultValue]) => ({
      key,
      value: savedMap[key] ?? defaultValue,
    }));
  }

  // ── Buscar valor de uma chave ───────────────────────────────────────────────
  async get(key: string): Promise<string> {
    const config = await this.prisma.systemConfig.findUnique({ where: { key } });
    return config?.value ?? DEFAULT_CONFIGS[key] ?? '';
  }

  // ── Upsert de múltiplos pares key/value ────────────────────────────────────
  async updateMany(configs: { key: string; value: string }[]): Promise<{ updated: number }> {
    const operations = configs
      .filter(c => c.key && c.key.trim())
      .map(c =>
        this.prisma.systemConfig.upsert({
          where:  { key: c.key.trim() },
          update: { value: c.value ?? '' },
          create: { key: c.key.trim(), value: c.value ?? '' },
        }),
      );

    await Promise.all(operations);
    return { updated: operations.length };
  }

  // ── Upsert de um único par ─────────────────────────────────────────────────
  async set(key: string, value: string) {
    return this.prisma.systemConfig.upsert({
      where:  { key },
      update: { value },
      create: { key, value },
    });
  }

  // ── Helper: obter valor como boolean ───────────────────────────────────────
  async getBoolean(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val === 'true' || val === '1';
  }

  // ── Helper: obter valor como número ────────────────────────────────────────
  async getNumber(key: string): Promise<number> {
    const val = await this.get(key);
    return parseFloat(val) || 0;
  }
}
