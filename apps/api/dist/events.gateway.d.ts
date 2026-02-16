import { Server } from 'socket.io';
export declare class EventsGateway {
    server: Server;
    handleMessage(data: {
        sender: string;
        message: string;
    }): void;
    sendPriceUpdate(ticker: string, price: number): void;
}
