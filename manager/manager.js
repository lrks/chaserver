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

var url = require('url');
var qs = require('querystring');
var fs = require('fs');
var http = require('http');
var board = require('./board');
var player = require('./player');
var server = http.createServer(handler);
var io = require('socket.io').listen(server, {'log level':LOG_LEVEL});
server.listen(WEB_PORT);

var SERVERS = {};

/**************************************/
/*             Web Server             */
/**************************************/
function handler(req, res) {
	var parse = url.parse(req.url, true);
	if (parse.pathname === '/') parse.pathname = '/index.html';
	
	// from CHServer
	if (req.method === 'POST') {
		var body = '';
		req.on('data', function(chunk) { body += chunk; });
		req.on('end', function() {
			var query = qs.parse(body);
			var response;
			
			if (parse.pathname === '/serverHello') {
				SERVERS[query.id] = board.Board(query.name);
				emitManager('serverHello',  {'id':query.id, 'name':query.name});
			} else if (parse.pathname === '/clientHello') {
				if (!(query.side === 'C' || query.side === 'H')) {
					res.writeHead(403);
					res.end('');
					return;
				}
				var plyer = player.Player(query.name, query.addr, query.port);
				SERVERS[query.id].setPlayer(query.side, plyer);
				emitManager('clientHello',  {'id':query.id, 'side':query.side, 'name':query.name, 'addr':query.addr, 'port':query.port});
			} else if (parse.pathname === '/serverStart') {
				emitManager('serverStart', {'id':query.id});
			} else if (parse.pathname === '/clientRequest') {
				var json = SERVERS[query.id].command(query.side, query.cmd);
				res = '{"result":"'+((json.state === -1) ? '1' : '0') + json.data.join()+'"}';
				emitManager('clientRequest', {'side':query.side, 'cmd':query.cmd, 'res':json});
			} else if (parse.pathname === '/clientError') {
				SERVERS[query.id].error(query.side, query.msg);
				emitManager('clientError', {'id':query.id, 'side':query.side, 'msg':query.msg});
			} else if (parse.pathname === '/serverDisconnect') {
				SERVERS[query.id].stop();
				delete SERVERS[query.id]
				emitManager('serverDisconnect', {'id':query.id});
			} else {
				res.writeHead(404);
				res.end('');
				return;
			}
			
			if (!response) response = '{"msg":"OK"}';
			res.writeHead(200, {'Content-Type':'application/json'});
			res.end(response);
			return;
		});
	}
	
	if (parse.pathname === '/isStart') {
		var flg = SERVERS[obj.id].isStart() ? 1 : 0;
		res.writeHead(200, {'Content-Type':'application/json'});
		res.end('{"flg":' + flg + '}');
		return;
	}
	
	
	// Static files
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
	/*------------------------------------*/
	/*               Manager              */
	/*------------------------------------*/
	socket.on('connectManager', function() {
		socket.join('manager');
		socket.room = 'manager';
		socket.emit('initialize', SERVERS);
	});
	
	socket.on('gameControl', function(obj) {
		if (socket.room !== 'manager') socket.disconnect();
		
		var msg;
		if (obj.msg === 'start') {
			var flg = SERVERS[obj.id].isReady();
			if (!flg) return;
			SERVERS[obj.id].start();
			msg = obj.msg;
		} else if (obj.msg === 'stop') {
			var flg = SERVERS[obj.id].isStart();
			if (!flg) return;
			SERVERS[obj.id].stop();
		} else {
			return;
		}
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
		
		SERVERS[obj.id].setMap(mpmp);
		socket.emit('getMap', {'name':mpmp.name, 'size':mpmp.size, 'turn':mpmp.turn, 'data':mpmp.data, 'player':mpmp.player, 'item':mpmp.item});
	});
	
	
	/*------------------------------------*/
	/*             Disconnect             */
	/*------------------------------------*/
	socket.on('disconnect', function() {
		console.log('disconnect');
	});
});
