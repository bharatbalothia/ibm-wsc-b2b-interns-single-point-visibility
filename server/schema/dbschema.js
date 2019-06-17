const graphql = require("graphql");
const _ = require("lodash");
const NCDB = require("node-couchdb");

const { mockevents, mockfiles } = require("../data/data");

const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull
} = graphql;

const couch = new NCDB({
 host: '9.202.179.47',
 protocol: 'http',
 port: 5984,  
 auth: {
        user: 'admin',
        password: 'admin123'
    }
});

const dbname = "spv";

const createFileItem = options => {
  const { File_ID, Payload, Orig_FileName } = options;

  return new Promise(function(resolve, reject) {
    couch.uniqid().then(ids => {
      couch
        .insert(dbname, {
          _id: ids[0],
          type: "file",
          File: [options]
        })
        .then(
          ({ data, headers, status }) => {
            resolve(data);
          },
          err => {
            reject(err);
          }
        );
    });
  });
};

const createEventItem = options => {
  const { Event_ID, End_Point, Protocol } = options;

  return new Promise(function(resolve, reject) {
    couch.uniqid().then(ids => {
      couch
        .insert(dbname, {
          _id: ids[0],
          Event: [options],
          type: "event"
        })
        .then(
          ({ data, headers, status }) => {
            resolve(data);
          },
          err => {
            reject(err);
          }
        );
    });
  });
};

const getEventDetails = () => {
  return new Promise(function(resolve, reject) {
    couch.get(dbname, "_design/events/_view/get_event_details").then(
      ({ data, headers, status }) => {
        let outputResponse = [];
        data &&
          data.rows &&
          data.rows.forEach(function(row) {
            row &&
              row.value &&
              row.value.forEach(function(key) {
                outputResponse.push(key);
              });
          });
        resolve(JSON.parse(JSON.stringify(outputResponse)));
      },
      err => {
        reject(mockevents);
      }
    );
  });
};

const getFileDetails = () => {
  return new Promise(function(resolve, reject) {
    couch.get(dbname, "_design/files/_view/get_file_details").then(
      ({ data, headers, status }) => {
        let outputResponse = [];
        
        data &&
          data.rows &&
          data.rows.forEach(function(row) {
            
            row &&
              row.value &&
              row.value.forEach(function(key) {
                
                outputResponse.push(key);
              });
          });
          console.log("Ha Ha HA",outputResponse)
        resolve(JSON.parse(JSON.stringify(outputResponse)));
      },
      err => {
        reject(mockfiles);
      }
    );
  });
};

const EventType = new GraphQLObjectType({
  name: "Event",
  fields: () => ({
    id: { type: GraphQLID },
    type: { type: GraphQLString },
    Event_ID: { type: GraphQLID },
    Event_Name : { type: GraphQLString },
    File_ID: { type: GraphQLID },
    End_Point: { type: GraphQLString },
    Timestamp: { type: GraphQLString },
    End_port: { type: GraphQLString },
    Protocol: { type: GraphQLString },
    WFID: { type: GraphQLString },
    Start_time: { type: GraphQLString },
    End_Time: { type: GraphQLString },
    Adapter_Type: { type: GraphQLString },
    Adapter_Name: { type: GraphQLString },
    Session_ID: { type: GraphQLString },
    Principal: { type: GraphQLString },
    Credential_Type: { type: GraphQLString },
    State: { type: GraphQLString },
    Is_Success: { type: GraphQLString },
    Document_ID: { type: GraphQLString },
    Remote_FileName: { type: GraphQLString },
    Entity_type: { type: GraphQLString },
    Producer_Name: { type: GraphQLString },
    Consumer_Name: { type: GraphQLString },
    Layer_Type: { type: GraphQLString },
    Layer_File_Name: { type: GraphQLString },
    Bytes_Transferred: { type: GraphQLString },
    file: {
      type: new GraphQLList(FileType),
      resolve(parent, args) {
        return getFileDetails().then(fileList => {
          return _.filter(fileList, function(file) {
            return (
              args.File_ID === file.File_ID ||
              args.Orig_FileName === file.Orig_FileName ||
              args.Payload === file.Payload ||
              args.File_Size === file.File_Size ||
              args.Start_Time === file.Start_Time ||
              args.Parent_Document_ID === file.Parent_Document_ID ||
              args.Mailbox === file.Mailbox
            );
          });
        });
        // return _.filter(mockfiles.File, { File_ID: parent.File_ID });
      }
    }
  })
});

const FileType = new GraphQLObjectType({
  name: "File",
  fields: () => ({
    id: { type: GraphQLID },
    type: { type: GraphQLString },
    File_ID: { type: GraphQLString },
    Orig_FileName: { type: GraphQLString },
    File_Size: { type: GraphQLString },
    Start_Time: { type: GraphQLString },
    Mailbox: { type: GraphQLString },
    Payload: { type: GraphQLString },
    Event_ID: { type: new GraphQLList(GraphQLString) },
    Parent_Document_ID: { type: GraphQLString },
    Child_Document_ID: { type: new GraphQLList(GraphQLString) },
    events: {
      type: new GraphQLList(EventType),
      resolve(parent, args) {
        return getEventDetails().then(eventList => {
          return _.filter(eventList, {
            File_ID: parent.File_ID
          });
        });
        // return _.filter(mockevents.Event, { File_ID: parent.File_ID });
      }
    }
  })
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: () => ({
    event: {
      type: EventType,
      args: {
        Event_ID: {
          type: GraphQLID
        },
        End_Point: {
          type: GraphQLString
        }
      },
      resolve(parent, args) {
        return getEventDetails().then(eventList => {
          return _.filter(eventList, 
            function(event)
            {
              return (
                args.File_ID === event.File_ID
              )
          });
        });
      }
    },
    file: {
      type: new GraphQLList(FileType),
      args: {
        File_ID: {
          type: GraphQLString
        },
        Orig_FileName: {
          type: GraphQLString
        },
        Mailbox:{type: GraphQLString},
        File_Size:{type: GraphQLString},
        Payload:{type: GraphQLString},
        Start_Time:{type: GraphQLString},
        Parent_Document_ID:{type: GraphQLString}

      },
      resolve(parent, args) {
        return getFileDetails().then(fileList => {
          return _.filter(fileList, function(file) {
            return (
              args.File_ID === file.File_ID ||
              args.Orig_FileName === file.Orig_FileName ||
              args.Payload === file.Payload ||
              args.File_Size === file.File_Size ||
              args.Start_Time === file.Start_Time ||
              args.Parent_Document_ID === file.Parent_Document_ID ||
              args.Mailbox === file.Mailbox

            );
          });
        });
      }
    },
    events: {
      type: new GraphQLList(EventType),
      resolve(parent, args) {
        return getEventDetails().then(eventList => {
          return eventList;
        });
      }
    },
    files: {
      type: new GraphQLList(FileType),
      resolve(parent, args) {
        return getFileDetails().then(fileList => {
          return fileList;
        });
      }
    }
  })
});

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addFile: {
      type: FileType,
      args: {
        File_ID: { type: new GraphQLNonNull(GraphQLString) },
        Payload: { type: GraphQLString },
        Orig_FileName: { type: GraphQLString }
      },
      resolve(parent, args) {
        return createFileItem(args).then(file => {
          return file;
        });
      }
    },
    addEvent: {
      type: EventType,
      args: {
        Event_ID: { type: new GraphQLNonNull(GraphQLID) },
        End_Point: { type: GraphQLString },
        Protocol: { type: GraphQLString },
        File_ID: { type: GraphQLString }
      },
      resolve(parent, args) {
        return createEventItem(args).then(event => {
          return event;
        });
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation
});
