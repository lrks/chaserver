/******************************************************************************/
/*                                                                            */
/*                                  CHaServer                                 */
/*                                -- Manager --                               */
/*                                                                            */
/******************************************************************************/
var express = require('express');
var io = require('socket.io');
var board = require('./board');
var player = require('./player');
var web = require('./web');


/**************************************/
/*            Configuration           */
/**************************************/
var WEB_PORT = 3000;


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
function emitManager(event, obj) { io.to('manager').emit(event, obj); }
function getRoom(sock) {
	sock.get('room', function(err, _room) {
		room = _room
	});
	return room;
}

io.listen(wserver, {'log level':LOG_LEVEL});
io.sockets.on('connection', function(socket) {
	/*------------------------------------*/
	/*               Server               */
	/*------------------------------------*/
	socket.on('message', function(obj) {
		switch(obj.event) {
		case 'serverHello':
			socket.join('board');
			socket.set('board', board.Board(obj.name));
			socket.set('room', 'board');
			emitManager(obj.event, {'name':obj.name, 'id':socket.id});
			break;
		case 'clientHello':
			plyer = player.Player(obj.name, obj.addr, obj.port);
			socket.get('board', function(err, _board) { _board.setPlayer(obj.side, plyer); });
			emitManager(obj.event, {'side':obj.side, 'name':obj.name, 'addr':obj.addr, 'port':obj.port});
			break;
		case 'clientRequest':
			var res;
			socket.get('board', function(err, _board) { res = _board.command(obj.side, obj.cmd); });
			socket.emit('message', ((res.state === -1) ? '1' : '0') + res.data.join());
			emitManager(obj.event, {'side':obj.side, 'cmd':obj.cmd, 'res':res});
			break;
		case 'clientError':
			socket.get('board', function(err, _board) { _board.error(obj.side, obj.msg); });
			emitManager(obj.event, {'side':obj.side, 'msg':obj.msg});
			break;
		}
	});
	
	
	/*------------------------------------*/
	/*               Manager              */
	/*------------------------------------*/
	socket.on('connectManager', function() {
		socket.join('manager');
		socket.set('room', 'manager');
		socket.set('manager', manager.Manager());
	});
	
	socket.on('gameControl', function(obj) {
		if (getRoom(socket) !== 'manager') socket.disconnect();
		
		var msg;
		if (obj.msg === 'start') {
			var flg = false;
			io.to(obj.id).get('board', function(err, _board) { flg = _board.isReady(); }
			if (!flg) return;
			io.to(obj.id).get('board', function(err, _board) { flg = _board.start(); }
			msg = obj.msg;
		} else if (obj.msg === 'stop') {
			var flg = false;
			io.to(obj.id).get('board', function(err, _board) { flg = _board.isStart(); }
			if (!flg) return;
			io.to(obj.id).get('board', function(err, _board) { flg = _board.stop(); }
			msg = '0000000000';
		} else {
			return;
		}
		
		io.to(obj.id).emit('message', msg);
	});
	
	socket.on('setMap', function(obj) {
		if (getRoom(socket) !== 'manager') socket.disconnect();
		
		var mpmp;
		try {
			mpmp = map.GameMap(obj.map);
		} catch(e) {
			socket.emit('errorMap', e.message);
			return;
		}
		
		io.to(obj.id).get('board', function(err, _board) { _board.setMap(mpmp); }
		socket.emit('getMap', {'name':mpmp.name, 'size', mpmp.size, 'turn':mpmp.turn, 'data':mpmp.data, 'player':mpmp.player, 'item':mpmp.item});
	});
	
	
	/*------------------------------------*/
	/*             Disconnect             */
	/*------------------------------------*/
	socket.on('disconnect', function() {
		if (getRoom(socket) === 'server') io.to(obj.id).get('board', function(err, board) { flg = board.stop(); }
		
	
	
		console.log('disconnect');
	});
});
