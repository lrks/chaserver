/******************************************************************************/
/*                                                                            */
/*                                  CHaServer                                 */
/*                                -- Server --                                */
/*                                                                            */
/******************************************************************************/
var net = require('net');
var express = require('express');
var io = require('socket.io');
var chaser = require('./chaser');
var web = require('./web');



/**************************************/
/*            Configuration           */
/**************************************/
var WEB_PORT = 3000;
var COOL_PORT = 40000;
var HOT_PORT = 50000;
var HOST = '127.0.0.1';



/**************************************/
/*             Web Server             */
/**************************************/
var app = express.createServer();
var wserver = app.get('/', function(req, res) {
	res.send('Hello world!');
}).listen(WEB_PORT);



/**************************************/
/*          WebSocket Server          */
/**************************************/
var score_manager = new web.ScoreManager(io);
var chserver = new chaser.NewGame(score_manager, COOL_PORT, HOT_PORT);

io.listen(wserver, {'log level':LOG_LEVEL});
io.sockets.on('connection', function(socket) {
	/*--------------------------*/
	/*          Manager         */
	/*--------------------------*/
	socket.on('connectManager', function(obj) {
		//if (obj.key != "test") io.sockets[socket.id].disconnect();
		score_manager.addManager(socket.id);	
	});
	
	
	/*--------------------------*/
	/*            Map           */
	/*--------------------------*/
	socket.on('map', function(obj) {
		if (!obj.map) return;
		if (!score_manager.isManager(socket.id)) return;
		chserver.updateMap(obj.map);
	});
	
	
	/*------------------------------------*/
	/*               Control              */
	/*------------------------------------*/
	socket.on('start', function() {
		if (!score_manager.isManager(socket.id)) return;
		chserver.start();
	}
	
	socket.on('end', function() {
		if (!score_manager.isManager(socket.id)) return;
		chserver.end();
	}
	
	
	
});


/**************************************/
/*             TCP Server             */
/**************************************/
var CHUNK = {};
var server = net.createServer(function (socket) {
	/*--------------------------*/
	/*      NEW CONNECTION!     */
	/*--------------------------*/
	if (chserver.connect(socket)) CHUNK[socket] = '';

	/*--------------------------*/
	/*      CHaser Command      */
	/*--------------------------*/
	socket.on('data', function(data) {
		CHUNK[socket] += data;
		
		var resume_flg = true;
		socket.pause();
		while(resume_flg) {
			var idx = CHUNK[socket].indexOf("\r\n");
			if (idx == -1) break;
			
			var line = CHUNK[socket].substring(0, idx);
			resume_flg = chaserver.command(socket, line);
			CHUNK[socket] = CHUNK[socket].substring(idx + 2, 0);
		}
		
		if (resume_flg) socket.resume();
	});
	
	/*--------------------------*/
	/*         Game End         */
	/*--------------------------*/
	socket.on('close', function(data) {
		chaser.close(socket);
		CHUNK = {};
	});
});

server.listen(COOL_PORT, HOST);
server.listen(HOT_PORT, HOST);
