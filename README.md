﻿# webmirror
Hosts communications server for chat and file services over socket.io

## Features:
- chat
- file services

## Usage
Starting server:
~~~
Command Line: npm start <port>
~~~

## Client connectivity
Clients connect using socket.io to the hosted port. Checkout webchat for
an example Client

## Command list
Prefix all commands with "."
- .help: Display command list
- .hello: Returns system greeting
- .name [name]: Get or set your name
- .users: List users online
- .version: Returns system greeting
- .whoami: Returns who you are

# System greeting
- displays date and time, version and current channel
