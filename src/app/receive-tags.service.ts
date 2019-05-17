import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReceiveTagsService {

  constructor(private http: HttpClient) { }

  getTags() {
    return this.http.get("http://spv1.fyre.ibm.com:4000/api/tags")
    .subscribe(data => {
      console.log("We got", data);
    });
  }
}
