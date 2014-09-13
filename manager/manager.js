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
var map = require('./map');
var server = http.createServer(handler);
var io = require('socket.io').listen(server, {'log level':LOG_LEVEL});
server.listen(WEB_PORT);

var SERVERS = {};


/**************************************/
/*             Web Server             */
/**************************************/
function error_http(res) {
	res.writeHead(400, {'Content-Type':'application/json'});
	res.end('{"msg":"NG"}');
}

function handler(req, res) {
	var parse = url.parse(req.url, true);
	if (parse.pathname === '/') parse.pathname = '/index.html';
	
	// from CHServer
	// POST
	if (req.method === 'POST') {
		var body = '';
		req.on('data', function(chunk) { body += chunk; });
		req.on('end', function() {
			var query = qs.parse(body);
			var response;
			
			if (parse.pathname === '/serverHello') {
				if (!query.id || !query.name) return error_http(res);
				SERVERS[query.id] = new board.Board(query.name);
				emitManager('serverHello',  {'id':query.id, 'name':query.name});
			} else if (parse.pathname === '/clientHello') {
				if (!query.id || !query.side) return error_http(res);
				if ((!query.addr || !query.port) && (!query.name)) return error_http(res);
				if (!(query.side === 'C' || query.side === 'H')) return error_http(res);
				
				if (!query.name) {
					var plyer = new player.Player(query.addr, query.port);
					SERVERS[query.id].setPlayer(query.side, plyer);
					emitManager('clientHello',  {'id':query.id, 'side':query.side, 'addr':query.addr, 'port':query.port});
				} else {
					SERVERS[query.id].setPlayerName(query.side, query.name);
					emitManager('clientHello',  {'id':query.id, 'side':query.side, 'name':query.name});
				}
			} else if (parse.pathname === '/serverStart') {
				if (!query.id) return error_http(res);
				emitManager('serverStart', {'id':query.id});
			} else if (parse.pathname === '/clientRequest') {
				if (!query.id || !query.side || !query.cmd) return error_http(res);
				var json = SERVERS[query.id].command(query.side, query.cmd);
				response = '{"result":"'+((json.state == -1) ? '1' : '0') + json.data.join('')+'"}';
				emitManager('clientRequest', {'id':query.id, 'side':query.side, 'cmd':query.cmd, 'res':json});
			} else if (parse.pathname === '/clientError') {
				if (!query.id || !query.side || !query.msg) return error_http(res);
				SERVERS[query.id].error(query.side, query.msg);
				emitManager('clientError', {'id':query.id, 'side':query.side, 'msg':query.msg});
			} else if (parse.pathname === '/serverDisconnect') {
				if (!query.id) return error_http(res);
				SERVERS[query.id].stop();
				delete SERVERS[query.id]
				emitManager('serverDisconnect', {'id':query.id});
			} else {
				return error_http(res);
			}
			
			if (!response) response = '{"msg":"OK"}';
			res.writeHead(200, {'Content-Type':'application/json'});
			res.end(response);
			return;
		});
	}
	
	// GET
	if (parse.pathname === '/isStart') {
		if (!parse.query.id) return error_http(res);
	
		var flg = SERVERS[parse.query.id].isStart() ? 1 : 0;
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
	console.log('Connect', socket.id);

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
		if (!obj.id || !obj.msg) return;
		
		var msg;
		if (obj.msg === 'start') {
			if (SERVERS[obj.id].isStart()) return;
			SERVERS[obj.id].start();
		} else if (obj.msg === 'stop') {
			if (SERVERS[obj.id].isStop()) return;
			SERVERS[obj.id].stop();
		} else {
			// noop
			return;
		}
	});
	
	socket.on('setMapRequest', function(obj) {
		if (socket.room !== 'manager') socket.disconnect();
		if (!obj.id || !obj.map) return;
		if (SERVERS[obj.id].isStart()) return;
		
		var mpmp;
		try {
			mpmp = new map.GameMap(obj.map);
		} catch(e) {
			emitManager('setMapResponse', {'error':true, 'msg':e.message});
			return;
		}
		
		SERVERS[obj.id].setMap(mpmp);
		emitManager('setMapResponse', {'error':false, 'name':mpmp.name, 'size':mpmp.size, 'turn':mpmp.turn, 'data':mpmp.data, 'player':mpmp.player, 'item':mpmp.item});
	});
	
	
	/*------------------------------------*/
	/*             Disconnect             */
	/*------------------------------------*/
	socket.on('disconnect', function() {
		console.log('Disconnect', socket.id);
	});
});
