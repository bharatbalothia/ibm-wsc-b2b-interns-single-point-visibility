import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DataServiceService } from '../data-service.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit {

  username : string;
  password : string;
  InvalidLogin : boolean;
  

  constructor(private router: Router, private http: HttpClient, private dataService: DataServiceService) { }

  ngOnInit() {
    
  }

  loginUser() {
    /*if (this.username == "admin" && this.password == "admin123")  
    {
      console.log("Authentication successful !")
      this.router.navigate(['dashboard']);
    } */

    this.http.post('http://spv1.fyre.ibm.com:3535/authenticate',{
      id: this.username,
      password: this.password
    }).subscribe( 
      (data : string) => {
        console.log("We got",data);
        if (data["status"] == "Correct") {
          this.router.navigate(['/dashboard'],{state: {"user" : this.username}});
        }
        if (data["status"] == "Incorrect") {
          this.InvalidLogin = true;
        }
      },
      error => {
        console.log("Error : ",Error);
      }
      );
  
  }
  
}
