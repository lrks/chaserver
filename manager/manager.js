/******************************************************************************/
/*                                                                            */
/*                                  CHaServer                                 */
/*                                -- Manager --                               */
/*                                                                            */
/******************************************************************************/
/**************************************/
/*            Configuration           */
/**************************************/
var WEB_PORT = 3000;
var DIR_NAME = 'web';
var LOG_LEVEL = 2;


var fs = require('fs');
var http = require('http');
var board = require('./board');
var player = require('./player');
var server = http.createServer(handler);
var io = require('socket.io').listen(server, {'log level':LOG_LEVEL});
server.listen(WEB_PORT);


/**************************************/
/*             Web Server             */
/**************************************/
var url = require('url');
var qs = require('querystring');

function handler(req, res) {
	var parse = url.parse(req.url, true);
	if (parse.pathname === '/') parse.pathname = '/index.html';
	
	fs.readFile(__dirname + '/' + DIR_NAME + parse.pathname, function(err, content) {
		if (err) {
			res.writeHead(500);
			res.end('Error!');
			return;
		}

		res.writeHead(200);
		res.end(content);
	});
}


/**************************************/
/*          WebSocket Server          */
/**************************************/
function emitManager(event, obj) { io.to('manager').emit(event, obj); }

io.sockets.on('connection', function(socket) {
	console.log(socket.id);

	/*------------------------------------*/
	/*               Server               */
	/*------------------------------------*/
	socket.on('message', function(obj) {
		switch(obj.event) {
		case 'serverHello':
			socket.join('board');
			socket.board = board.Board(obj.name);
			socket.room = 'board';
			emitManager(obj.event, {'name':obj.name, 'id':socket.id});
			break;
		case 'clientHello':
			plyer = player.Player(obj.name, obj.addr, obj.port);
			socket.board.setPlayer(obj.side, plyer);
			emitManager(obj.event, {'side':obj.side, 'name':obj.name, 'addr':obj.addr, 'port':obj.port});
			break;
		case 'clientRequest':
			var res = socket.board.command(obj.side, obj.cmd);
			socket.emit('message', ((res.state === -1) ? '1' : '0') + res.data.join());
			emitManager(obj.event, {'side':obj.side, 'cmd':obj.cmd, 'res':res});
			break;
		case 'clientError':
			socket.board.error(obj.side, obj.msg);
			emitManager(obj.event, {'side':obj.side, 'msg':obj.msg});
			break;
		}
	});
	
	
	/*------------------------------------*/
	/*               Manager              */
	/*------------------------------------*/
	socket.on('connectManager', function() {
		socket.join('manager');
		socket.room = 'manager';
		socket.manager = manager.Manager();
	});
	
	socket.on('gameControl', function(obj) {
		if (socket.room !== 'manager') socket.disconnect();
		
		var msg;
		if (obj.msg === 'start') {
			var flg = io.to(obj.id).board.isReady();
			if (!flg) return;
			io.to(obj.id).board.start();
			msg = obj.msg;
		} else if (obj.msg === 'stop') {
			var flg = io.to(obj.id).board.isStart();
			if (!flg) return;
			io.to(obj.id).board.stop();
			msg = '0000000000';
		} else {
			return;
		}
		
		io.to(obj.id).emit('message', msg);
	});
	
	socket.on('setMap', function(obj) {
		if (socket.room !== 'manager') socket.disconnect();
		
		var mpmp;
		try {
			mpmp = map.GameMap(obj.map);
		} catch(e) {
			socket.emit('errorMap', e.message);
			return;
		}
		
		io.to(obj.id).board.setMap(mpmp);
		socket.emit('getMap', {'name':mpmp.name, 'size':mpmp.size, 'turn':mpmp.turn, 'data':mpmp.data, 'player':mpmp.player, 'item':mpmp.item});
	});
	
	
	/*------------------------------------*/
	/*             Disconnect             */
	/*------------------------------------*/
	socket.on('disconnect', function() {
		if (socket.room === 'server') io.to(obj.id).board.stop();

		console.log('disconnect');
	});
});
