import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class FileDetailsService {

  constructor(private http: HttpClient) {

   }

   getFileDetails() {
     return this.http.get("http://spv1.fyre.ibm.com:4000/api/FileDetails")
     .subscribe(data => {
       console.log("We got",data);
     });
   }
}
