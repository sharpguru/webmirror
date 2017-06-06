var finalhandler = require('finalhandler');
var http = require('http');
var port = process.env.port || 1337;
var express = require('express');
var app = express();
var logger = require('morgan');
var low = require('lowdb');

app.use(logger('dev'));

app.get('/', function (req, res) {

    res.send('hello world');
})

var server = app.listen(port);
var io = require('socket.io')(server);

server.listen(port, function () {
    console.log('webmirror Express server listening on port ' + port);
});

// database
const db = low();
db.defaults({ messages: [] }).write(); // create empty array of messages
const uuid = require('uuid');

io.on('connection', function (socket) {
    console.log('a user connected');
    var collection = db.get('messages').takeRight(10).value();
    console.log(collection);
    //console.log('db state:');
    //console.log(db.getState());

    // sending old messages 
    collection.forEach(chat => {
        socket.emit('chat', chat.msg);
    });
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    socket.on('chat', function (msg) {
        socket.broadcast.emit('chat', msg);

        console.log('pushing message: ' + msg);
        //db.get('messages').push({ msg: msg, id: uuid() }).write();
        db.get('messages').push({ msg: msg }).write();

        // Remove old messages
        var msgs = db.get('messages').takeRight(100).value();
        var dbstate = db.getState();
        dbstate.messages = msgs;
        db.setState(dbstate);
        
        // console.log(db.getState()); // log all messages
        console.log(msg); // log current message

    });

    socket.emit('connected', 'You are now connected to webmirror');
});
