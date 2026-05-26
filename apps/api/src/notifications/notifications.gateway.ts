import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    this.logger.log(`Cliente ${client.id} entrou na sala: ${room}`);
  }

  @OnEvent('order.created')
  handleOrderCreated(order: any) {
    this.server.emit('order:new', {
      type: 'NEW_ORDER',
      orderId: order.id,
      orderNumber: order.orderNumber,
      type_order: order.type,
      total: order.total,
      tableNumber: order.table?.number,
      message: `Novo pedido ${order.orderNumber}`,
      sound: true,
    });
  }

  @OnEvent('order.statusChanged')
  handleOrderStatusChanged(data: { order: any; status: string }) {
    const { order, status } = data;
    this.server.emit('order:status', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status,
      message: `Pedido ${order.orderNumber} - ${status}`,
    });

    // Notificar sala do pedido específico
    this.server.to(`order:${order.id}`).emit('order:update', order);
  }

  @OnEvent('order.ready')
  handleOrderReady(order: any) {
    this.server.emit('order:ready', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.table?.number,
      message: `Pedido ${order.orderNumber} está pronto!`,
      sound: true,
    });
  }

  @OnEvent('order.preparing')
  handleOrderPreparing(order: any) {
    this.server.to(`order:${order.id}`).emit('order:update', {
      ...order,
      message: 'Em preparo',
    });
  }

  // Notificar sala específica de um pedido (para cliente acompanhar)
  notifyOrderStatus(orderId: string, data: any) {
    this.server.to(`order:${orderId}`).emit('order:update', data);
  }

  // Broadcast para todos
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}
