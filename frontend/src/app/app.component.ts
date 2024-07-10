import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  prompt: string = '';
  response: string = '';

  constructor(private http: HttpClient) { }

  sendPrompt() {
    this.http.post<any>('http://localhost:3000/decide-function', { userprompt: this.prompt })
      .subscribe(
        res => {
          this.response = res.result;
        },
        err => {
          console.error('Error:', err);
        }
      );
  }
}
