import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.css']
})
export class DatePickerComponent implements OnInit {

  startDate : Date;
  endDate : Date;
  dummyText: string;
  
  items = [{id: 1,
    date:'2000-02-01',
  text: 'ID Number 1 some text'},
  {id: 2, 
    date:'2001-05-02',
  text: "ID Number 2 some text"},
  {id: 3, 
    date: '2010-03-02',
  text: "ID Number 3 some text"},
  {id: 4,
    date: '2016-04-12',
  text: "ID Number 4 some text"},
{
  id: 5,
  date: '2017-05-21',
  text: "ID Number 5 some text"},
  {
    id: 6,
    date: '2018-05-01',
    text: "ID Number 6 some text"},
    {
      id: 7,
      date: '2018-06-01',
      text: "ID Number 7 some text"
    },
    {
      id: 8,
      date: '2018-08-02',
      text: "ID Number 8 some text"
    }
];

dummy = {
  id: 0,
  date: 'some date',
  text: "some text"
};

visibility = false;
visibilityTable = false;
searchedResults = [];
  
  constructor() { 
    
  }

  ngOnInit() {
  }


  searchByDate(start : Date,end : Date) : void {
    this.searchedResults = [];
    this.visibilityTable = true;
    for (let i = 0; i < this.items.length; i++) {
      if (new Date(this.items[i].date) >= new Date(start) && new Date(this.items[i].date) <= new Date(end)) {
        //console.log("Yes");
        this.searchedResults.push(this.items[i]);
      }
    }
  }

  @HostListener('window:keyup',['$event'])
  keyEvent(event : KeyboardEvent) {
    if (event.keyCode === 27) {
      this.hideOverlay();
    }
  }

  hideOverlay() : void {
    document.getElementById("overlay").style.display = "None";
  }

  

  handleListButtonClick(item) : void {
    console.log("Clicked");
    console.log(item.text);
    this.dummyText = item.text;
    this.visibility = true;
    this.dummy = item;    
    document.getElementById("overlay").style.display = "block";
  }

  
}