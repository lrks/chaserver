/******************************************************************************/
/*                                                                            */
/*                                  CHaServer                                 */
/*                                -- Manager --                               */
/*                                                                            */
/******************************************************************************/
$(function() {
	var SERVERS = {};
	var Server = function(name) {
		this.name = name;
		this.playing = false;
	};
	
	function updateServerList() {
		var svs = [];
		$.each(SERVERS, function(id, sv) {
			svs.push(id + "("+sv.name+")");
		});
		
		$("#servers").text(svs.join(', '));
	}
	
	function zf2(str) {
		return ("0" + str).slice(-2);
	}
	
	function noticeConsole(event, msg) {
		var time = new Date();
		var str = "<p>("+zf2(time.getHours())+":"+zf2(time.getMinutes())+":"+zf2(time.getSeconds())+"): "+msg+"</p>";
		$("#log").prepend(str);
		console.log(event, msg);
	}
	
	/**************************************/
	/*              WebSocket             */
	/**************************************/
	var SOCKET = io.connect(null, {port:3000});
	
	SOCKET.on('serverHello', function(obj) {
		var sv = new Server(obj.id, obj.name);
		SERVERS[obj.id] = sv;
		updateServerList();
		noticeConsole('serverHello', obj.id+":"+obj.name);
	});
	
	SOCKET.on('clientHello', function(obj) {
		var str = '';
		if (obj.name) {
			str = obj.name;
		} else {
			str = obj.addr+":"+obj.port;
		}
	
		noticeConsole('clientHello', obj.id+":"+str);
	});
	
	SOCKET.on('clientRequest', function(obj) {
		SERVERS[obj.id].playing = true;
	
		console.log('ゲーム試合中');
		console.log(obj);
	});
	
	SOCKET.on('clientError', function(obj) {
		noticeConsole('Error', "side "+obj.side+", "+obj.msg);
	});
	
	SOCKET.on('setMapResponse', function(obj) {
		console.log('マップ');
		console.log(obj);
	});
	
	SOCKET.on('serverDisconnect', function(obj) {
		noticeConsole('serverDisconnect', obj.id);
		if (SERVERS[obj.id]) { delete SERVERS[obj.id]; }
		updateServerList();
	});
	
	SOCKET.on('serverStart', function(obj) {
		SERVERS[obj.id].playing = true;
		noticeConsole('gameStart', obj.id);
	});
	
	SOCKET.on('initialize', function(obj) {
		console.log('初期化');
		console.log(obj);
	});
	
	
	/* 送信側 */
	SOCKET.emit('connectManager');
	
	function getServerId() {
		var id = $("#sid").val();
		if (!checkServer(id)) {
			noticeConsole('MyError', 'そんなIDはない');
			return null;
		}
		return id;
	}
	
	function checkServer(sid) {
		var flg = false;
		$.each(SERVERS, function(id, value) {
			if (sid !== id) return true;
			flg = true;
			return false;
		});
		return flg;
	}
	
	$(".game_ctrl").click(function() {
		var id = getServerId();
		if (id == null) return;
		
		var msg = null;
		if ($(this).is("#game_start")) {
			msg = 'start';	
		} else if ($(this).is("#game_stop")) {
			msg = 'stop';
		} else {
			return;
		}
	
		SOCKET.emit('gameControl', {'id':id, 'msg':msg});
	});
	
	$("#map_send").click(function() {
		var id = getServerId();
		if (id == null) return;
	
		var map = $("#map").val();
		SOCKET.emit('setMapRequest', {'id':id, 'map':map});
	});
	
	
	
	
	
	
	
	
	
	
	
	function makeTable(row, col) {
		var data = '';
		for (var i=0; i<row; i++) {
			var line = '<tr>';
			for (var j=0; j<col; j++) {
				line += '<td></td>';
			}
			line += '</tr>';
			data += line;
		}
		
		$("#board").html(data);
	}
	
	makeTable(10, 5);
	
	
	
	
	
	
	
	
	
	
	
	
});