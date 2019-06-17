const express = require("express");
const graphqlHTTP = require("express-graphql");
const helmet = require("helmet");
const request = require("request-promise");
const bodyParser = require("body-parser");
const path = require("path");
const NCDB = require("node-couchdb");
const dotenv = require("dotenv").config();
const cors = require("cors");
var bluepage = require("ibm_bluepages");

const schema = require("./schema/dbschema");

const dbname = "spv";
const fileEndpoint = "_design/myDesignDoc/_view/get_file_details?keys=";
const eventEndpoint = "_design/myDesignDoc/_view/get_event_details?keys=";
const filterEndpoint = "_design/myDesignDoc/_view/filter_tags?keys=";
const app = express();

app.use(cors());
app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true
  })
);

app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const couch = new NCDB({
 host: '9.202.179.47',
 protocol: 'http',
 port: 5984,  
 auth: {
        user: 'admin',
        password: 'admin123'
    }

});

couch.listDatabases().then(function(dbs) {
  console.log(dbs);
});

app.get("/get_tags", function(req, res) {
  couch
    .get(dbname, "_design/myDesignDoc/_view/get_tags")
    .then(function(data, headers, status) {
      let response = [];
      data.data.rows.forEach(function(row) {
        if (row.key == req.query.type || !req.query.type) {
          row.value.forEach(function(tags) {
            tags.forEach(function(tag) {
              let keyValuePair = Object.assign(
                {},
                {
                  key: tag,
                  value: tag.replace(/_/g, " ")
                }
              );
              response.push(keyValuePair);
            });
          });
        }
      });
      const eventDetailsNew = Object.assign({}, { response });
      res.send(response);
    });
});

app.get("/get_events_by_filters", function(req, res) {
  //  app.get("/get_tags", function (req, res){
  let APIendpoint = filterEndpoint + '["' + req.query.tag + '"]';
  var eventDetails = [];
  var finalfilterResults = [];
  couch.get(dbname, APIendpoint).then(function(data, headers, status) {
    var finalResult;
    const filteredResults = data.data.rows.filter(function filterByValue(item) {
      if (
        req.query.filterValue &&
        item.value[req.query.tag] == req.query.filterValue
      ) {
        return true;
      } else if (!req.query.filterValue) {
        return true;
      } else {
        return false;
      }
    });

    const fileTypeCollection = filteredResults.filter(function filterByType(
      item
    ) {
      if (Array.isArray(item.value.Event_ID)) return true;
      else return false;
    });

    if (fileTypeCollection.length > 0) {
      for (var i = 0, len = fileTypeCollection.length; i < len; i++) {
        finalfilterResults.push(
          request(
            "http://localhost:3535/get_events_by_fileid?FileID=" +
              fileTypeCollection[i].value.File_ID
          )
        );
      }

      Promise.all(finalfilterResults)
        .then(resp => {
          const unescapedData = resp;
          const eventDetailsNew = Object.assign({}, { data: unescapedData });

          res.send(eventDetailsNew);
          // Result of all resolve as an array
        })
        .catch(err => console.log(err)); // First rejected promise
    } else {
      const eventDetailsNew = Object.assign({}, { filteredResults });

      res.send(eventDetailsNew);
    }
  });
});
app.get("/get_events_by_fileid", function(req, res) {
  let APIendpoint = fileEndpoint + '["' + req.query.FileID + '"]';
  var eventDetails = [];
  couch.get(dbname, APIendpoint).then(
    function(data, headers, status) {
      data.data.rows.forEach(function(row) {
        let eventIds = "";
        row.value.Event_ID.forEach(function(eventId) {
          eventIds += ',"' + eventId + '"';
        });
        let eventAPIEndpoint =
          eventEndpoint + "[" + eventIds.substring(1, eventIds.length) + "]";

        couch.get(dbname, eventAPIEndpoint).then(
          function(data, headers, status) {
            data.data.rows.forEach(function(row) {
              eventDetails.push(row.value);
            });

            const eventDetailsNew = Object.assign({}, { event: eventDetails });
            res.send(eventDetailsNew);
          },
          function(err) {
            console.log(err);
          }
        );
      });
    },
    function(err) {
      res.send(err);
    }
  );
});
app.get("/", function(req, res) {
  let APIendpoint = fileEndpoint + '["' + req.query.key + '"]';
  var eventDetails = [];
  couch.get(dbname, APIendpoint).then(
    function(data, headers, status) {
      data.data.rows.forEach(function(row) {
        let eventIds = "";
        row.value.Event_ID.forEach(function(eventId) {
          eventIds += ',"' + eventId + '"';
        });
        let eventAPIEndpoint =
          eventEndpoint + "[" + eventIds.substring(1, eventIds.length) + "]";
        couch.get(dbname, eventAPIEndpoint).then(
          function(data, headers, status) {
            data.data.rows.forEach(function(row) {
              eventDetails.push(row.value);
            });
            res.render("index", {
              eventDetails: eventDetails
            });
          },
          function(err) {}
        );
      });
    },
    function(err) {
      res.send(err);
    }
  );
});

app.post('/authenticate',function(req,res) {
	var user_id = req.body.id;
	var password = req.body.password;
	bluepage.authenticate(user_id,password,function(value) {
	//res.setHeader('Access-Control-Allow-Origin','*');
	
	if (value == false) {
		console.log("Your Id or password is incorrect");
		res.send({status:"Incorrect"});
	}

	if (value == true) {
		console.log("You have successfully logged in !");
		res.send({status: "Correct"});
	}

});


});

app.post('/saveSearch',function(req,res) {
	couch.update("spv", {
		"type" : "user_profile",
		"_rev" : req.body.RevisionNumber,
		"_id" : req.body.User_ID,
		"File_ID" : req.body.File_ID,
		"Orig_FileName" : req.body.Orig_FileName,
		"File_Size" : req.body.File_Size,
		"Start_Time" : req.body.Start_Time,
		"Mailbox" : req.body.Mailbox,
		"Payload" : req.body.Payload,
		"Event_ID" : req.body.Event_ID,
		"Parent_Document_ID" : req.body.Parent_Document_ID,
		"Child_Document_ID" : req.body.Child_Document_ID,
		"Number_Of_Columns" : req.body.Number_Of_Columns,
		"Column_Mapping" : req.body.Column_Mapping
		
	}).then(({data,headers,status}) => {
		res.send({status : "Correct"});
	},err => {
		console.log(err);
	});
});

/*
app.get('/loadSearch',function(req,res) {
const startKey = [req.body.userID];
const endKey = [req.body.userID];
const queryOptions = {
	startKey,
	endKey
}

couch.get("spv","_design/savedSearch/_view/search").then(({data,headers,status}) => {
	res.send(data);
}, err => {

});

});
*/


app.listen(3535, function() {
  console.log("Server::listening on port 3535");
});
