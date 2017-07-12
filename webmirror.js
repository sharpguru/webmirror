var finalhandler = require('finalhandler');
var http = require('http');
var port = process.env.port || 1337;
var express = require('express');
var app = express();
var logger = require('morgan');
var low = require('lowdb');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
const { URL } = require('url');

app.use(logger('dev'));

app.get('/', function (req, res) {

    res.send('hello world');
})

var server = app.listen(port);
var io = require('socket.io')(server);

// Server info
var ServerInfo = "webmirror Express server v1.0";

server.listen(port, function () {
    ServerInfo = ServerInfo + ' listening on port ' + port;
    console.log(ServerInfo);
});



// database
const db = low();
db.defaults(
  { messages: [],
    users: [],
    help: [],
    shares:[] }).write(); // init stuff

// Set help messages collection
function addHelp(msg) {
  db.get('help').push({ msg: msg }).write();
}

addHelp('Prefix all commands with "."');
addHelp('- .cd [path] view or change directory');
addHelp('- .copy [source] [dest] copy files');
addHelp('- .dir: List share contents');
addHelp('- .help: Display command list');
addHelp('- .hello: Returns system greeting');
addHelp('- .name: Get or set your name');
addHelp('- .share [localpath] [sharename]: Get or set drive share');
addHelp('- .users: List users online');
addHelp('- .version: Returns system greeting');
addHelp('- .whoami: Returns who you are');
var helpmessages = db.get('help').value();

console.log(helpmessages);


const uuid = require('uuid');

io.on('connection', function (socket) {
    var id = socket.id;
    console.log('User connected: ' + socket.id);
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
        // add username to message
        msg = '(' + getUserName(id) + ') ' + msg;
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

    socket.on('help', function() {
      console.log('user needs help: ' + id);

      // sending help
      helpmessages.forEach(hlp => {
          socket.emit('returnmessage', hlp.msg);
      });
    });

    socket.on('hello', function () {
      console.log('say hello to user: ' + id);

      socket.emit('returnmessage', 'You are now connected to '
        + ServerInfo + '. '
        + 'System date and time: '
        + Date()
      );

      //var currentRoom = socket.rooms[Object.keys(socket.rooms)];
      //socket.emit('returnmessage', 'You are in room: ' + currentRoom);
    })

    socket.on('name', function (newname) {

      console.log('newname: ' + newname);
      if (!newname) {
        var usr = getCurrentUser(id).value();
        var usrname = (usr && usr.name) ? usr.name : '(unknown)';
        console.log('returning user name...' + usrname);
        socket.emit('returnmessage', usrname);
      } else {

        console.log('setting username: ' + newname);
        console.log(getCurrentUser(id).value());

        getCurrentUser(id)
          .assign({name: newname})
          .write();

        socket.emit('returnmessage', 'username set: ' + newname);
      }
    });

    socket.on('users', function() {
      var users = db.get('users').value();
      console.log(users);
      socket.emit('returnmessage', users);
    })

    socket.on('version', function() {
      socket.emit('returnmessage', ServerInfo);
    })

    socket.on('whoami', function(whom) {
      console.log('who ' + whom);
      console.log(id);

      socket.emit('returnmessage', 'You are ' + getCurrentUser(id).value().name);
    });



    // FILE COMMANDS
    // These should really be local

    var currentShare = undefined;

    socket.on('cd', function(path) {
      if (!path) {
        // return current path
        if (!currentShare || !currentShare.currentPath) {
          socket.emit('returnmessage', 'undefined');
        } else {
          socket.emit('returnmessage', currentShare.currentPath);
        }
      }
    })

    socket.on('shares', function() {
      listShares();
    })

    socket.on('share', function(args) {
      var localpath = args.name;
      var sharename = args.pat;

      if (!localpath || !sharename) {
        // console.log('localpath or sharename not set ');
        // console.log(localpath);
        // console.log(sharename);

        // list shares
        listShares();
      } else {
        console.log('setting share');

        // Set share
        var user = getCurrentUser(id).value();

        // validate localpath
        //var myFileURL = new URL('file://C:/data'); // maybe someday
        // TODO: Add support for windows drive letters and absolute urls
        var pathname = path.join(__dirname, localpath);
        console.log(pathname);
        fs.access(pathname, (err) => {
          if (err) {
            if (err.code === 'ENOENT') {
              console.error('myfile does not exist');
              socket.emit('returnmessage', 'path not found!');
            }
          } else {
            var share = {
              name: sharename,
              path: localpath,
              userid: id
            }; // TODO: Replace user id with more permanent user public key

            db.get('shares').push(share).write();
            socket.emit('returnmessage', 'share added!');
          }
        });
      }
    });

    function listShares() {
      console.log('listing shares');
      //var sharecollection = db.get('shares').find({'userid':id});
      var sharecollection = db.get('shares').value();

      console.log(sharecollection);

      socket.emit('returnmesage', 'shares (' + sharecollection.length + ')');
      sharecollection.forEach(share => {
          socket.emit('returnmessage', printShare(share));
      });
    }

    // Get current user
    function getCurrentUser(id) {
      console.log('Looking for user: ' + id);
      var user = db.get('users').find({ 'socket': id });
      console.log(user.value());
      return user;
    }

    // Get user name
    function getUserName(userid) {
      return getCurrentUser(userid).value().name;
    }

    // Save current user
    var user = {
      socket: id
    }

    // Print share
    function printShare(share) {
      var result = share.path + ' ' + share.name + ' ' + share.userid;
      return result;
    }

    db.get('users').push(user).write();
    socket.emit('connected', 'You are now connected to ' + ServerInfo, id);
});
