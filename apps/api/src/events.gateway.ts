import {
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class EventsGateway {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('sendMessage')
    handleMessage(@MessageBody() data: { sender: string; message: string }) {
        this.server.emit('newMessage', data);
    }

    // Use this to push price updates
    sendPriceUpdate(ticker: string, price: number) {
        this.server.emit('priceUpdate', { ticker, price });
    }
}
