import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  // ====== PIX ======
  async generatePix(orderId: string, amount: number) {
    // Integração real seria com banco/PSP. Aqui geramos dados mock para desenvolvimento.
    const pixKey = this.config.get('PIX_KEY') || '00020101021126580014br.gov.bcb.pix';
    const txId = uuidv4().replace(/-/g, '').slice(0, 25);

    // Atualizar payment com dados do PIX
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        method: 'PIX',
        amount,
        status: 'PENDING',
        pixKey,
        externalId: txId,
        pixQrCode: `PIX_QR_${txId}`, // Em produção seria o QR real
      },
    });

    return {
      paymentId: payment.id,
      txId,
      pixKey,
      qrCode: payment.pixQrCode,
      amount,
      expiresIn: 3600,
    };
  }

  // ====== STONE ======
  async createStonePayment(orderId: string, amount: number, method: string) {
    const sandboxMode = this.config.get('STONE_SANDBOX') === 'true';
    this.logger.log(`Criando pagamento Stone: ${method} - R$ ${amount} [${sandboxMode ? 'SANDBOX' : 'PROD'}]`);

    // Em produção: chamar API da Stone
    // POST https://api.stone.com.br/api/v1/charges
    const mockTransactionId = `STONE_${uuidv4().slice(0, 8).toUpperCase()}`;

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        method: method as any,
        amount,
        status: 'PENDING',
        externalId: mockTransactionId,
        externalRef: `stone_${Date.now()}`,
      },
    });

    return { paymentId: payment.id, transactionId: mockTransactionId, status: 'PENDING' };
  }

  async confirmPayment(paymentId: string) {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  async cancelPayment(paymentId: string) {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'CANCELLED' },
    });
  }

  // Webhook da Stone/PSP
  async handleWebhook(payload: any) {
    this.logger.log('Webhook recebido:', JSON.stringify(payload));

    if (payload.status === 'PAID' || payload.status === 'approved') {
      await this.prisma.payment.updateMany({
        where: { externalId: payload.transaction_id || payload.id },
        data: { status: 'PAID', paidAt: new Date() },
      });
    }

    return { received: true };
  }
}
