/******************************************************************************/
/*                                                                            */
/*                                  CHaServer                                 */
/*                                -- Server --                                */
/*                                                                            */
/******************************************************************************/
var net = require('net');
var chaser = require('./chaser');
var express = require('express');
var io = require('socket.io');

/**************************************/
/*            Configuration           */
/**************************************/
var WEB_PORT = 3000;
var COOL_PORT = 40000;
var HOT_PORT = 50000;
var HOST = '127.0.0.1';


/**************************************/
/*             TCP Server             */
/**************************************/
var CHUNK = {};
var server = net.createServer(function (socket) {
	/*--------------------------*/
	/*      NEW CONNECTION!     */
	/*--------------------------*/
	if (chaser.newGame(socket, cool_port, hot_port)) {
		CHUNK[socket] = '';
	}
	

	/*--------------------------*/
	/*      CHaser Command      */
	/*--------------------------*/
	socket.on('data', function(data) {
		CHUNK[socket] += data;
		
		socket.pause();
		while(1) {
			var idx = CHUNK[socket].indexOf("\r\n");
			if (idx == -1) break;
			
			var line = CHUNK[socket].substring(0, idx);
			chaser.game(socket, line);
			
			CHUNK[socket] = CHUNK[socket].substring(idx + 2, 0);
		}
		socket.resume();
	});
	
	
	/*--------------------------*/
	/*         Game End         */
	/*--------------------------*/
	socket.on('close', function(data) {
		chaser.endGame();
		var socks = chaser.getCH();
		for (var i=0; i<socks.length; i++) {
			CHUNK[socks] = null;
		}
	});
});

server.listen(COOL_PORT, HOST);
server.listen(HOT_PORT, HOST);


/**************************************/
/*             Web Server             */
/**************************************/
var app = express.createServer();
var server = app.get('/', function(req, res) {
	res.send('HerokuでNode.jsとExpressを使ってHello world!');
}).listen(WEB_PORT);


/**************************************/
/*          WebSocket Server          */
/**************************************/
io.listen(server, {'log level':LOG_LEVEL});
io.sockets.on('connection', function(socket) {


});
