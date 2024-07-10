import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000'); // Your backend URL

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    subscribeToUpdates(callback: (data: any) => void) {
        socket.on('weatherUpdate', callback);
    }

    unsubscribeFromUpdates() {
        socket.off('weatherUpdate');
    }
}
