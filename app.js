const express = require('express');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

// const mysql = require('mysql');
// const dotenv = require('dotenv');
require('dotenv').config();
// const multer = require('multer');
// const fs = require('fs');

// Difined Routes!
const LetsChat = require('./routes/LetsChat');
const videocall = require('./routes/videocall');
const videocall2 = require('./routes/videocall2');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false })); // urlencoded form parser
app.use(bodyParser.json())  // json parser
app.use(cors("*"));

// route pointer
// app.use('/', LetsChat);
app.use('/videocall', videocall);
app.use('/videocall2', videocall2);

//online status
var onlineStatus = {}

app.get('/webrtctokens', function(req, res){
   let https = require("https");
   console.log("Request was fired");
   let o = {
      format: "urls"
   };

let bodyString = JSON.stringify(o);
   let options = {
      host: "global.xirsys.net",
      path: "/_turn/motherhonestlydev",
      method: "PUT",
      headers: {
         "Authorization": "Basic " + Buffer.from("MotherHonestly:7df13afc-96c0-11ec-8ff1-0242ac130002").toString("base64"),
         "Content-Type": "application/json",
         "Content-Length": bodyString.length
      }
};

let httpreq = https.request(options, function(httpres) {
      let str = "";
      httpres.on("data", function(data){ 
         str += data; console.log("data: ", str) 
         return res.send(true);
      });

      httpres.on("error", function(e){ console.log("error: ",e)});

      httpres.on("end", function(){ 
          console.log("ICE List: ", str);
          httpreq.end();
      });
});

httpreq.on("error", function(e){ 
   console.log("request error: ",e)
   return res.send(false);
});

// httpreq.end();

});

app.get('/onlineStatus', function(req, res){
    console.log(onlineStatus);
    if(onlineStatus.hasOwnProperty(req.query.id))
        return res.send(true);

    return res.send(false);

});

var personalSocketX = {}

io.on('connection', function(socket){

          socket.on('connect-to-chat-server', function(data, callback){
             if(data.hasOwnProperty("callerEmail")){
                 personalSocketX[data["callerEmail"]] = socket;
                 onlineStatus[data["callerEmail"]] = true;
             }
             if(data.hasOwnProperty("recipientEmail")){
                 onlineStatus[data["recipientEmail"]] = true;
                 personalSocketX[data["recipientEmail"]] = socket;
             }
                 
            //  console.log(onlineStatus)
          });

          socket.on("checkIfRecipientIsOnline", function(data, callback){
             if(personalSocketX.hasOwnProperty(data["recipientEmail"])){
                  data["recipientIsOnline"] = true;
                  personalSocketX[data['callerEmail']].emit("recipientIsOnline", data);
             }else{
                  personalSocketX[data['callerEmail']].emit("recipientIsOnline", data);
             }
            
            //  console.log("m")
          });
          
          socket.on("checkIfCallerIsOnline", function(data, callback){
            if(personalSocketX.hasOwnProperty(data["callerEmail"])){
               data["callerIsOnline"] = true;
               personalSocketX[data['recipientEmail']].emit("callerIsOnline", data);
            }else {
               personalSocketX[data['recipientEmail']].emit("callerIsOnline", data);
            }
            // console.log("u")
          })

          socket.on('webRTCOffer', function(data, callback){
             if(personalSocketX.hasOwnProperty(data['recipientEmail']))
                  personalSocketX[data['recipientEmail']].emit("webRTCOffer", data);
            //  console.log(data);
          });

          socket.on('webRTCAnswer', function(data, callback){
            if(personalSocketX.hasOwnProperty(data['callerEmail']))
                 personalSocketX[data['callerEmail']].emit("webRTCAnswer", data);

            // console.log(data);
         });

         socket.on('new-ice-candidate-local', function(data, callback){
            if(personalSocketX.hasOwnProperty(data['callerEmail']))
                 personalSocketX[data['callerEmail']].emit("new-ice-candidate-found-on-remote-local", data);

            console.log(data);
         });

         socket.on('new-ice-candidate-remote', function(data, callback){
            console.log(data.recipientEmail)
            if(personalSocketX.hasOwnProperty(data['recipientEmail']))
                 personalSocketX[data['recipientEmail']].emit("new-ice-candidate-found-on-remote-remote", data)

            // console.log(data);
         });

         socket.on("turnserverFound",function(data, callback){
            console.log(data.recipientEmail)
            if(personalSocketX.hasOwnProperty(data['recipientEmail']))
                 personalSocketX[data['recipientEmail']].emit("incomingTurnServer", data)
         });
         
});

io.on('disconnect', function(socket){
   for(var x in personalSocketX){
      if(personalSocketX[x] == socket){
         personalSocketX = _.omit(personalSocketX, x);
         onlineStatus = _.omit(onlineStatus, x)
      }
   }
   console.log('someone just disconnected from Lets Chat')
})

server.listen(9001, function(){
	console.log('LetsChat Server is Running  ::: port ::: 9001');
});

module.exports = app;

//minimalistic application set up
