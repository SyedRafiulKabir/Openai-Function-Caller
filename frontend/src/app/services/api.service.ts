import { Injectable } from '@angular/core';
import axios from 'axios';

const API_URL = 'http://localhost:3000'; // Your backend URL

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    async decideFunction(userPrompt: string) {
        return axios.post(`${API_URL}/decide-function`, { userprompt: userPrompt });
    }
}
