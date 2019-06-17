var ldap = require('ldapjs');
var domParser = require('xmldom').DOMParser;
var select  = require('xpath.js');
var nodegrass = require('nodegrass');
var colors = require('colors');

//author: guojial@cn.ibm.com
//version: v1.1.5

//first param: intranetID 
module.exports.getNameByIntranetID = function (intranetID, callback) {

    var result;
    //console.log(("-----groupname-----"+groupname).blue);
    nodegrass.get("https://bluepages.ibm.com/BpHttpApisv3/slaphapi?ibmperson/mail=" + intranetID + ".list/byxml", function(data,status,headers){
          //console.log(status);
          var doc = new domParser().parseFromString(data);
          //console.log(("-----attr-----"+select(doc, "//attr").length).blue);
          if (select(doc, "//attr").length > 0) {
            var nodeGivenname = select(doc, "//attr[@name='givenname']/value");
            var nodeGivennameValue = nodeGivenname[0].firstChild.data;

            var nodeSn = select(doc, "//attr[@name='sn']/value");
            var snValue = nodeSn[0].firstChild.data;

            result = nodeGivennameValue + " " + snValue;
          } else {
            result = "error";
          }

          //console.log(("-----result-----"+result).blue);
          callback(result);
          },'utf8').on('error', function(e) {
          console.log(("Got error: " + e.message).red);
    });
};

//first param: intranetID
getDnValue = function (intranetID, callback) {

    var result;
    //console.log(("-----groupname-----"+groupname).blue);
    nodegrass.get("https://bluepages.ibm.com/BpHttpApisv3/slaphapi?ibmperson/mail=" + intranetID + ".list/byxml", function(data,status,headers){
          //console.log(status);
          var doc = new domParser().parseFromString(data);
          var nodes = select(doc, "//directory-entries/entry");
          if (nodes.length==0) {
            return callback(false);
          }
          result = nodes[0].getAttribute('dn');
          //console.log(("-----result-----"+result).blue);
          callback(result);
          },'utf8').on('error', function(e) {
          console.log(("Got error: " + e.message).red);
    });
};

//first param: intranetID, second param: password.
module.exports.authenticate = function(intranetID, password, callback) {

  var result = false;

  getDnValue(intranetID, function(dnValue) {

    if (dnValue==false) {
            return callback(false);
        }

    var reg_1 = /,/;   
    var reg_2 = /=/;

    var uidStr = dnValue.split(reg_1)[0];
    var uid = uidStr.split(reg_2)[1];

    //console.log(('uid: ' + uid).blue);

    var client = ldap.createClient({
     url: 'ldaps://bluepages.ibm.com:636'
    });

    var opts = {
     filter: '(uid='+ uid +')',
     scope: 'sub',
     timeLimit: 500 
    };

    try {
        client.bind(dnValue, password, function (error) {
            if(error){
                //console.log(error.message);
                result = false;
                callback(result);
                client.unbind(function(error) {
                  if(error) {
                    console.log(("unbind error: " + error.message).red);
                  } else {
                    //console.log(("client disconnected on searchEntry").blue);
                  }});
            } else {
                //console.log(("connected").blue);
                client.search('ou=bluepages,o=ibm.com', opts, function(error, search) {
                    
                    //console.log(("opts" + opts.filter).blue);

                    //console.log("Searching.....".blue);
                    search.on('searchEntry', function(entry) {
                        if(entry.object){
                            //console.log('entry: %j ' + JSON.stringify(entry.object));
                            result = true;
                            callback(result);
                        }
                        client.unbind(function(error) {
                          if(error){
                            console.log(("unbind error: " + error.message).red);
                          } else {
                            //console.log(("client disconnected on searchEntry").blue);
                          }});
                    });

                    search.on('error', function(error) {
                        console.error('error: ' + error.message);
                        client.unbind(function(error) {
                          if(error){
                            console.log(("unbind error: " + error.message).red);
                          } else {
                            console.log(("client disconnected on searchEntry").blue);
                          }});
                    });

                });
            }
        });
    } catch(error){
        console.log(error);
        client.unbind(function(error) {
          if(error){
             console.log(("unbind error: " + error.message).red);
          } else {
             console.log(("client disconnected on searchEntry").red);
          }});
    }

    
  });

};

//first param: intranetID
getAttrValue = function (intranetID, attrName, callback) {

    var result;
    //console.log(("-----groupname-----"+groupname).blue);
    nodegrass.get("https://bluepages.ibm.com/BpHttpApisv3/slaphapi?ibmperson/mail=" + intranetID + ".list/byxml", function(data,status,headers){
          //console.log(status);
          var doc = new domParser().parseFromString(data);
          var nodes = select(doc, "//directory-entries/entry/attr");
          if (nodes.length==0) {
            return callback(false);
          }
          var nodeValue;
          //console.log("-----"+attrName);
          //console.log("-----"+nodes.length);
          for (var i = 0;i<nodes.length;i++) {
            if (attrName == nodes[i].getAttribute("name")) {
              //console.log("-----"+nodes[i].getAttribute("name"));
              //console.log("-----"+select(doc, "//attr[@name='"+attrName+"']/value/text()"));
        nodeValue = select(doc, "//attr[@name='"+attrName+"']/value/text()");
        //console.log("-----"+nodeValue);
            } 
          }
          result = nodeValue;
          //console.log(("-----result-----"+result).blue);
          callback(result);
          },'utf8').on('error', function(e) {
          console.log(("Got error: " + e.message).red);
    });
};

//w3-services1.w3-969.ibm.com/myw3/unified-profile-photo/v1/image/guojial@cn.ibm.com?type=bp
module.exports.getPhotoByIntranetID = function(intranetID, callback) {

  var result;
  getAttrValue(intranetID, "preferredidentity", function(preferredidentityValue) {
    if (preferredidentityValue==false) {
            return callback(false);
        }
      result = "https://w3-services1.w3-969.ibm.com/myw3/unified-profile-photo/v1/image/" + preferredidentityValue +".jpg";    
      callback(result);
  });
}


module.exports.getPersonInfoByIntranetID = function(intranetID, callback) {

    var result;
    nodegrass.get("https://bluepages.ibm.com/BpHttpApisv3/slaphapi?ibmperson/mail=" + intranetID + ".list/byxml", function(data,status,headers){
          var doc = new domParser().parseFromString(data);
          if (select(doc, "//attr").length > 0) {
            var nodeGivenname = select(doc, "//attr[@name='givenname']/value");
            var nodeGivennameValue = nodeGivenname[0].firstChild.data;

            var nodeSn = select(doc, "//attr[@name='sn']/value");
            var snValue = nodeSn[0].firstChild.data;

            var userName = nodeGivennameValue + " " + snValue;
          
            nodePreferredidentityValue = select(doc, "//attr[@name='preferredidentity']/value/text()");
            var userPhoto = "https://w3-services1.w3-969.ibm.com/myw3/unified-profile-photo/v1/image/" + nodePreferredidentityValue +"?type=bp";
      
            var userJobrespons;
            if (select(doc, "//attr[@name='jobresponsibilities']").length > 0) {
              userJobrespons = select(doc, "//attr[@name='jobresponsibilities']/value/text()")[0].data;
            } else {
              userJobrespons = "";
            }

            var userTelephonenumber;
            if (select(doc, "//attr[@name='telephonenumber']").length > 0) {
              userTelephonenumber = select(doc, "//attr[@name='telephonenumber']/value/text()")[0].data;
            } else {
              userTelephonenumber = "";
            }

            var userNotesemail;
            if (select(doc, "//attr[@name='notesemail']").length > 0) {
              userNotesemail = select(doc, "//attr[@name='notesemail']/value/text()")[0].data;
            } else {
              userNotesemail = "";
            }

            var userEmail;
            if (select(doc, "//attr[@name='mail']").length > 0) {
              userEmail = select(doc, "//attr[@name='mail']/value/text()")[0].data;
            } else {
              userEmail = "";
            }

            var userManager;

            if (select(doc, "//attr[@name='manager']").length > 0) {
              userManager = select(doc, "//attr[@name='manager']/value/text()")[0].data;
            } else {
              userManager = "";
            }            

            result = {
              "userName" : userName,
              "userPhoto" : userPhoto,
              "userJobrespons" : userJobrespons,
              "userTelephonenumber" : userTelephonenumber,
              "userNotesemail" : userNotesemail,
              "userEmail" : userEmail
            }

          } else {
            result = "error";
          }

          //console.log(("-----result-----"+result).blue);
          callback(result);
          },'utf8').on('error', function(e) {
          console.log(("Got error: " + e.message).red);
    });
}