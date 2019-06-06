import { Component, OnInit, ViewChild, HostListener} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BnNgIdleService } from 'bn-ng-idle';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';



@Component({
  selector: 'app-search-criteria',
  templateUrl: './search-criteria.component.html',
  styleUrls: ['./search-criteria.component.css']
})
export class SearchCriteriaComponent implements OnInit {

 
  tags = [];
  fileDetails = {};
  selectedDropdown;
  displayTags = [];
  tagValues = [];
  searchItem;
  FileID = "";
  displayResults = [];
  columnValues = [];
  rowValues = [];
  rowValues1 = [];
  filesArray = [];
  eventsArray = [];
  eventsDisplay = [false,false,false];
  treeVisibility = true;
  eventsTableVisibility = false;
  userID : String;
  p : number = 1;
  displayPagination = false;
  fromDate;
  ToDate;
  Number_of_Columns : Number;
  displayNumberofColumns = false;
  dropdownList = [];
  dropdownSettings = {};
  selectedItems = [];
  RevisionNumber = "";
  columnMapping = [];


  constructor(private http : HttpClient, private bnIdle: BnNgIdleService, 
    private router: Router, public activateRoute: ActivatedRoute) {
    this.userID = router.getCurrentNavigation().extras.state["user"];
    //Session Timeout of 5 minutes
    /*this.bnIdle.startWatching(300).subscribe((res) => {
      if(res) {
        this.router.navigate(['']);

      }
    })*/  
  }

  

  trackByIdx(index: number, obj: any): any {
    return index;
  }
  
  saveSearch() : void {
    let savedSearch = 
      {
        "User_ID" : this.userID,
        "RevisionNumber": this.RevisionNumber,
        "File_ID" : "",
        "Orig_FileName" : "",
        "File_Size" : "",
        "Start_Time" : "",
        "Mailbox" : "",
        "Payload" : "",
        "Event_ID" : "",
        "Parent_Document_ID" : "",
        "Child_Document_ID" : "",
        "Number_Of_Columns" : [],
        "Column_Mapping" : []
      };
    for (let i = 0; i < this.displayTags.length; i++) {
      for (let j = 0; j < this.columnMapping.length; j++) {
        if (this.displayTags[i] == this.columnMapping[j].new_tag) {
          savedSearch[this.columnMapping[j].orig_tag] = this.tagValues[i];
        }
      }
      
    }
    savedSearch["Number_Of_Columns"] = this.selectedItems;
    savedSearch["Column_Mapping"] = this.columnMapping;
    console.log(savedSearch);
    this.http.post("http://spv1.fyre.ibm.com:3535/saveSearch",savedSearch).subscribe(
      data => {

      },
      error => {
        console.log(error);
      }
    );
  }

  @HostListener('window:keyup',['$event'])
  keyEvent(event : KeyboardEvent) {
    if (event.keyCode === 27) {
      this.hideOverlay();
    }
  }

  loadSearch() : void {
    this.displayTags = [];
    this.tagValues = [];

    this.http.get("http://spv1.fyre.ibm.com:5984/spv/_design/savedSearch/_view/search?startkey=%22" + this.userID + "%22").subscribe(
      data => {
        console.log(data);
        let desiredObject = data["rows"];
        let desiredObject1 = desiredObject[0];
        let desiredObject2 = desiredObject1["value"];
        this.columnMapping = desiredObject2["Column_Mapping"];
        console.log("Column Mapping : " + this.columnMapping);
        for (let key in desiredObject2) {
          if (key == "_id" || key == "Number_Of_Columns" || key == "type" || key == "_rev" || key == "Column_Mapping") {
            continue;
          }
          if (desiredObject2[key] != "") {
            console.log(key);
            for (let j = 0; j < this.columnMapping.length;j++) {
              let dummy = this.columnMapping[j];
              //console.log(this.columnMapping[j].orig_tag);
              if (key == dummy['orig_tag']) {
                console.log("Key : " + key);
                this.displayTags.push(dummy['new_tag']);
                this.tagValues.push(desiredObject2[key]);
              }
            }
          }
        }
        this.selectedItems = desiredObject2["Number_Of_Columns"];
        this.RevisionNumber = desiredObject2["_rev"];
        console.log(this.Number_of_Columns);
        this.getTags();
        this.searchQuery();
        
        
      },
      error => {
        console.log(error);
      }
    )

  }

  
  hideOverlay() : void {
    document.getElementById("overlay").style.display = "None";
  }

  makeTree(fileObject) {
    this.eventsArray = fileObject[9];
    this.treeVisibility = true;
    this.eventsTableVisibility = false;    
    console.log("Clicked !");
    this.FileID = fileObject[1];
    console.log(fileObject);
    //this.FileID = fileObject["File_ID"];
    for (let i = 0; i < this.eventsArray.length; i++) {
      this.eventsDisplay[i] = true;
      if (this.eventsArray[i].State == "Success") {
        document.getElementById("event" + i).style.backgroundColor = "LightGreen";
        continue;
      }
      if (this.eventsArray[i].State = "Failure") {
        document.getElementById("event" + i).style.backgroundColor = "Red";
        continue;
      }
    }
    document.getElementById("overlay").style.display = "block";
  }

  displayEventsTable(eventObject) {
     this.eventsTableVisibility = true;
     
     for (let i = 0; i < this.eventsDisplay.length; i++) {
      this.eventsDisplay[i] = false;
    }
    console.log(eventObject);
    this.rowValues1 = [];    
    
    
    for (let key in eventObject) {
      let dummy1 = [];
      dummy1.push(key);
      dummy1.push(eventObject[key]);
      this.rowValues1.push(dummy1);
    }
    this.treeVisibility = false;  
    
  }
  

  searchQuery() {
    let queryObject = {
      "operationName": null,
      "variables": {
        "Mailbox": "",
        "File_ID": "",
        "Parent_Document_ID": "",
        "Orig_Filename" : "",
        "File_Size" : "",
        "Start_Time" : "",
        "Payload" : ""
      },
      "query": "query ($File_ID: String, $Orig_FileName: String,$Mailbox: String) {\n  file(File_ID: $File_ID, Orig_FileName: $Orig_FileName,Mailbox:$Mailbox) {\n    type\n    File_ID\n    Orig_FileName\n    File_Size\n    Start_Time\n    Mailbox\n    Payload\n    Event_ID\n  Parent_Document_ID\n  events {\n      File_ID\n      Event_ID\n      End_Point\n      Timestamp\n      End_port\n      Protocol\n      WFID\n      Start_time\n      End_Time\n      Adapter_Type\n      Adapter_Name\n      Session_ID\n      Principal\n      Credential_Type\n      State\n      Is_Success\n      Document_ID\n      Remote_FileName\n      Entity_type\n      Producer_Name\n      Consumer_Name\n      Layer_Type\n      Layer_File_Name\n      Bytes_Transferred\n      __typename\n    }\n    __typename\n  }\n}\n"
    };
    
    for (let i = 0; i < this.displayTags.length; i++) {
      for (let j = 0; j < this.columnMapping.length; j++) {
        if (this.displayTags[i] == this.columnMapping[j].new_tag) {
          queryObject.variables[this.columnMapping[j].orig_tag] = this.tagValues[i]; 
        }
      }
    }

    this.columnValues = [];
    this.rowValues = [];
    
    console.log(queryObject);

    this.http.post("http://spv1.fyre.ibm.com:3535/graphql",queryObject).subscribe(
      data => {
        console.log("We got",data);
        let dummy = data["data"];
        this.filesArray = dummy["file"];
        console.log(this.filesArray);
        for (let key in this.filesArray[0]) {
          this.columnValues.push(key)
          
        }
        for (let i = 0; i < this.columnMapping.length; i++) {
          this.dropdownList.push({ item_id : i + 1, item_text: this.columnMapping[i].new_tag});
        }
        this.columnValues = [];
        for (let i = 0; i < this.selectedItems.length;i++) {
          let dumdum = {};
          dumdum = this.selectedItems[i];
          /*if (dumdum['item_text'] == 'events') {
            continue;
          } */
          //console.log(dumdum);
          for (let j = 0; j < this.columnMapping.length; j++) {
            let dummy = this.columnMapping[j];
            //console.log(dummy);
            if (dumdum['item_text'] === dummy['new_tag']) {
              //console.log(dummy);
              this.columnValues.push(dummy)
            }
          }
                    
        }
        console.log(this.columnValues);

        for (let obj1 of this.filesArray) {
          let dummy = [];
          
          for (let item of this.columnValues) {
            
            dummy.push(obj1[item.orig_tag]);
          }
          //dummy.push(obj1['events'])
          this.rowValues.push(dummy);
        }
        this.displayPagination = true;
        this.displayNumberofColumns = true;  
      
      
      }
    )

    

    
  }
  
  
  addTag() {
    if (this.tags.length > 0) {
      this.displayTags.push(this.selectedDropdown); 
      this.tagValues.push("");  
    }
    for (let i = 0; i < this.tags.length; i++) {
      if (this.selectedDropdown === this.tags[i].key) {
        this.tags.splice(i,1);
      }
    }
    this.selectedDropdown = "";
  }

  showStatus() {
    for (let i = 0; i < this.filesArray.length; i++) {
      console.log(this.filesArray);
      let dummy = [];
      dummy = this.filesArray[i].events;
      console.log("Events : ");
      for (let obj1 of dummy) {
        if (obj1.State == "Success") {
          
          document.getElementById("rowNumber" + i).style.backgroundColor = "LightGreen";
          continue;
        }
        if (obj1.State == "Failure") {
          console.log("fail = " + i);
          document.getElementById("rowNumber" + i).style.backgroundColor = "Orange";
          break;
        }
      }
    }
  }

  getTags() {
    console.log(this.columnMapping);
    for (let j = 0; j < this.columnMapping.length; j++) {
      this.tags.push(this.columnMapping[j].new_tag);
    }
    console.log(this.tags);
    for (let i = 0; i < this.displayTags.length; i++) {
      for (let j = 0; j < this.tags.length; j++) {
        if (this.displayTags[i] == this.tags[j].key) {
          this.tags.splice(j,1);
        }
    }
    }
    
    
  }
  
  ngOnInit() { 
    this.loadSearch();
    
    let today = new Date();
    this.Number_of_Columns = 10;
    let temp = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + (today.getDate()) + ' ' + (today.getHours() + 5) + ':' + ((today.getMinutes() + 30) % 60);
    let temp1 = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + (today.getDate() - 1) + ' ' + (today.getHours() + 5) + ':' + ((today.getMinutes() + 30) % 60);
    this.ToDate = new Date(temp).toISOString().split('.')[0];
    this.fromDate = new Date(temp1).toISOString().split('.')[0];
    console.log(this.fromDate);
    console.log(this.ToDate);
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 3,
      allowSearchFilter: true
    };
    
   }


}