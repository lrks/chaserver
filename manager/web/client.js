/******************************************************************************/
/*                                                                            */
/*                                  CHaServer                                 */
/*                                -- Manager --                               */
/*                                                                            */
/******************************************************************************/
$(function() {
	var SERVERS = {};
	var HISTORIES = {};
	var SOCKET = io.connect(null, {port:3000});
	var SCORE_FLG = false;
	SOCKET.emit('connectManager');
	this.history = [];
	
	/*------------------------------------*/
	/*            Manager side            */
	/*------------------------------------*/
	toManager();
	
	function toManager() {
		$("#score").hide();
		$("#manager").show();
	}
	
	$("#to_score").click(function() {
		var id = getServerId();
		if (id == null) return;
		toScore(sid);
	});
	
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
	
	
	/*------------------------------------*/
	/*             Score side             */
	/*------------------------------------*/
	$(window).on('load resize', function() {
		if (!SCORE_FLG) return;
		adjustTable();
	});
	
	function toScore(sid) {
		$("#manager").hide();
		$("#score").show();
		
		makeTable(sid, (!SERVERS[sid] || !SERVERS[sid].map) ? null : SERVERS[sid].map);
		adjustTable();
		
		SCORE_FLG = true;
	}
	
	function makeTable(sid, map) {
		console.log("てーぶるつくるよー");
		console.log(map);
		if (SERVERS[sid]) {
			if (SERVERS[sid].player['C']) $("#c_name").text(SERVERS[sid].player['C']);
			if (SERVERS[sid].player['H']) $("#h_name").text(SERVERS[sid].player['H']);
		}
		
		if (map != null) {
			$("#turn").text(map.turn);
			$("#c_item").text(map.item['C']);
			$("#h_item").text(map.item['H']);
		}

		var col = ((map == null) ? 15 : map.size[0]) + 2;
		var row = ((map == null) ? 17 : map.size[1]) + 2;
		var data = '';
		
		for (var i=0; i<row; i++) {
			var line = '<tr>';
			for (var j=0; j<col; j++) {
				var cls = 'floor';
				if (map == null) {
					cls = 'block';
				} else {
					var d = map.data[(i - 1) * map.size[0] + (j - 1)];
					if (d === void 0) {
						cls = 'block';
					} else if (d === 2) {
						cls = 'block';
					} else if (d === 3) {
						cls = 'item';
					}
									
					if ((j - 1) === map.player['C'][0] && (i - 1) === map.player['C'][1]) {
						if (cls === 'block') {
							cls += ' c';
						} else {
							cls = 'c';
						}
					}
					if ((j - 1) === map.player['H'][0] && (i - 1) === map.player['H'][1]) {
						if (cls === 'block') {
							cls += ' h';
						} else {
							cls = 'h';
						}
					}
				}
			
				line += '<td class="'+cls+'"></td>';
			}
			line += '</tr>';
			data += line;
		}
		
		console.log(data);
		$("#board").html(data);
	}
	
	function adjustTable() {
		var board = $("#board");
		var col = board.find("tr").eq(1).find("td").length;
		var row = board.find("tr").length;
		
		if (!col) col = 1;
		if (!row) row = 1;
	
		var offset = $("#score").offset();
		var w = ($(window).width() - offset.left * 2) / col;
		var h = ($(window).height() - offset.top * 2) / row;
		var size = ~~((w < h) ? w : h);
		
		var slct = board.find("td");
		slct.width(size);
		slct.height(size);
	}
	
	function updateTable(turn, sid, obj) {
		// update of base map
		$.each(obj.diff, function(i, val) {
			SERVERS[sid].map.data[val.idx] += val.add;
			
			var y = ~~(val.idx / SERVERS[sid].map.size[0]);
			var x = val.idx - (y * SERVERS[sid].map.size[0]);
			console.log('変更', x, y);
			var slct = $("#board tr").eq(y + 1).find("td").eq(x + 1);
			
			$.each(['floor', 'block', 'c', 'h', 'item'], function(i, val) {
				if (slct.hasClass(val)) {
					console.log(val, '消したんやで');
					slct.removeClass(val);
				}
			});
			
			var cls = 'block';
			switch(SERVERS[sid].map.data[val.idx]) {
			case 0:
				cls = 'floor';
				break;
			case 2:
				cls = 'block';
				break;
			case 3:
				cls = 'item';
				break;
			default:
				cls = 'block';
			}
			
			slct.addClass(cls);
			console.log(cls 'セットしたんやで');
		});
		
		// update of player positon
		$.each(obj.player, function(side, pos) {
			var slct = $("#board tr").eq(pos[1] + 1).find("td").eq(pos[0] + 1);
			slct.addClass((side === 'C') ? 'c' : 'h');
			console.log(side 'は', pos[0], pos[1]);
		});
		
		
		// update item and turn
		$("#turn").text(turn);
		$("#c_item").text(obj.item['C']);
		$("#h_item").text(obj.item['H']);
	}
	
	function timeMachine(turn, sid, obj) {
		$.each(obj.diff, function(i, v) {
			obj.diff[i] *= -1;
		});
		updateTable(turn, sid, obj);
	}
	
	
	/*------------------------------------*/
	/*             Server side            */
	/*------------------------------------*/
	var Server = function(name) {
		this.name = name;
		this.playing = false;
		this.map = null;
		this.player = {'C':null, 'H':null};
	};
	Server.prototype.setMap = function(map){ this.map = map; }
	
	function updateServerList() {
		var svs = [];
		$.each(SERVERS, function(id, sv) {
			svs.push(id + "("+sv.name+")");
		});
		
		$("#servers").text(svs.join(', '));
	}
	
	var Map = function(name, size, turn, data, player, item) {
		this.name = name;
		this.size = size;
		this.turn = turn;
		this.data = data;
		this.player = player;
		this.item = item;
	}

	
	/*------------------------------------*/
	/*              WebSocket             */
	/*------------------------------------*/
	SOCKET.on('serverHello', function(obj) {
		var sv = new Server(obj.name);
		SERVERS[obj.id] = sv;
		updateServerList();
		noticeConsole('serverHello', obj.id+":"+obj.name);
	});
	
	SOCKET.on('clientHello', function(obj) {
		var str = obj.name ? obj.name : obj.addr+":"+obj.port;
		if (obj.name) SERVERS[obj.id].player[obj.side] = obj.name;
		noticeConsole('clientHello', obj.id+":"+str);
	});
	
	SOCKET.on('clientError', function(obj) {
		noticeConsole('Error', obj.id+", "+"side "+obj.side+", "+obj.msg);
	});
	
	SOCKET.on('setMapResponse', function(obj) {
		if (obj.error) {
			noticeConsole('MapError', obj.id+","+obj.msg);
			return;
		}
	
		var map = new Map(obj.name, obj.size, obj.turn, obj.data, obj.player, obj.item);
		SERVERS[obj.id].setMap(map);
		noticeConsole('RecieveMap', obj.id+", ("+obj.name+")");
		
		if ($("#sid").val() == obj.id && SCORE_FLG) {
			makeTable(obj.id, (!SERVERS[sid] || !SERVERS[sid].map) ? null : SERVERS[sid].map);
			adjustTable();
		}
	});
	
	SOCKET.on('serverDisconnect', function(obj) {
		noticeConsole('serverDisconnect', obj.id);
		if (SERVERS[obj.id]) { delete SERVERS[obj.id]; }
		updateServerList();
	});
	
	SOCKET.on('serverStart', function(obj) {
		SERVERS[obj.id].playing = true;
		noticeConsole('gameStart', obj.id);
		
		HISTORIES[obj.id] = [];
	});
	
	SOCKET.on('initialize', function(obj) {
		$.each(obj, function(sid, sv) {
			var new_server = new Server(sv.name);
			if (sv.map) {
				var mp = new Map(sv.map.name, sv.map.size, sv.map.turn, sv.map.data, sv.map.player, sv.map.item);
				new_server.map = mp;
			}
			if (sv.start_flg) {
				new_server.playing = true;
				HISTORIES[obj.id] = [];
				noticeConsole('gameStart@init', sid);
			}
			
			SERVERS[sid] = new_server;
			noticeConsole('serverHello@init', sid+":"+sv.name);
		});
		
		updateServerList();
	});
	
	SOCKET.on('clientRequest', function(obj) {
		SERVERS[obj.id].playing = true;
		noticeConsole('clientCommand', obj.id+":("+obj.side+")"+obj.cmd+" -> "+((obj.res.state == -1) ? '1' : '0') + obj.res.data.join(''));
		if (obj.cmd === "gr") return;
		
		HISTORIES[obj.res.turn] = {'diff':obj.res.diff, 'player':obj.res.player, 'item':obj.res.item};
		updateTable(obj.res.turn, obj.id, HISTORIES[obj.res.turn]);
	});
	
	
	/*------------------------------------*/
	/*               Utility              */
	/*------------------------------------*/
	function zf2(str) { return ("0" + str).slice(-2); }
	
	function noticeConsole(event, msg) {
		var time = new Date();
		var str = "<p>("+zf2(time.getHours())+":"+zf2(time.getMinutes())+":"+zf2(time.getSeconds())+"): "+msg+"</p>";
		$("#log").prepend(str);
		console.log(event, msg);
	}
	
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
});