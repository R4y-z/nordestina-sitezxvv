import { Controller, Post, Body, Param, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Pagamentos')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @Post('pix/:orderId')
  generatePix(@Param('orderId') orderId: string, @Body('amount') amount: number) {
    return this.paymentsService.generatePix(orderId, amount);
  }

  @ApiBearerAuth()
  @Post('stone/:orderId')
  createStonePayment(
    @Param('orderId') orderId: string,
    @Body('amount') amount: number,
    @Body('method') method: string,
  ) {
    return this.paymentsService.createStonePayment(orderId, amount, method);
  }

  @ApiBearerAuth()
  @Post(':id/confirm')
  confirmPayment(@Param('id') id: string) {
    return this.paymentsService.confirmPayment(id);
  }

  @Public()
  @Post('webhook')
  handleWebhook(@Body() payload: any, @Headers() headers: any) {
    return this.paymentsService.handleWebhook(payload);
  }
}
