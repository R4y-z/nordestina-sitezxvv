import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { TablesModule } from './tables/tables.module';
import { KitchenModule } from './kitchen/kitchen.module';
import { CashierModule } from './cashier/cashier.module';
import { DeliveryModule } from './delivery/delivery.module';
import { StockModule } from './stock/stock.module';
import { FinancialModule } from './financial/financial.module';
import { CustomersModule } from './customers/customers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { ComandasModule } from './comandas/comandas.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    MenuModule,
    OrdersModule,
    TablesModule,
    KitchenModule,
    CashierModule,
    DeliveryModule,
    StockModule,
    FinancialModule,
    CustomersModule,
    DashboardModule,
    ReportsModule,
    NotificationsModule,
    PaymentsModule,
    ComandasModule,
    SettingsModule,
  ],
})
export class AppModule {}
