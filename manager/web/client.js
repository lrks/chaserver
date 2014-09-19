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
	var HISTORY_MODE = false;
	SOCKET.emit('connectManager');
	this.history = [];
	
	/*------------------------------------*/
	/*            Manager side            */
	/*------------------------------------*/
	toManager();
	$(document).keypress(function(e) {
		if (SCORE_FLG && String.fromCharCode(e.which) != 'M') toManager();
		return true;
	});
	
	function toManager() {
		$("#score").hide();
		$("#manager").show();
		SCORE_FLG = false;
	}
	
	$("#to_score").click(function() {
		if (SCORE_FLG) return;
	
		var id = $("#sid").val();
		if (!id) {
			noticeConsole('MyError', 'ServerIDが空っぽいのでやめます');
			return;
		}
		
		window.localStorage.setItem('sid', id);
	
		$("#manager").hide();
		$("#score").show();

		makeTable(id, (!SERVERS[id] || !SERVERS[id].map) ? null : SERVERS[id].map);
		adjustTable();
		
		SCORE_FLG = true;
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
	
	$(document).keydown(function(e) {
		if (!SCORE_FLG) return true;
		
		var id = window.localStorage.getItem('sid');
		if (SERVERS[id] && SERVERS[id].playing) return true;
		if (!HISTORIES[id]) return true;
		var now_turn = parseInt($("#turn").text()) + 1;

		if (e.keyCode === 37) {
			// Prev
			if (!HISTORIES[id].history[now_turn + 1]) return true;
			updateTable(now_turn + 1, id, HISTORIES[id].history[now_turn + 1], true, true);
		} else if (e.keyCode === 39) {
			// Next
			if (!HISTORIES[id].history[now_turn - 1]) return true;
			updateTable(now_turn - 1, id, HISTORIES[id].history[now_turn - 1], false, true);
		} else {
			return true;
		}
		
		HISTORY_MODE = true;
		return true;
	});
	
	function makeTable(sid, map) {
		if (SERVERS[sid]) {
			if (SERVERS[sid].player['C']) $("#side_c .name").text(SERVERS[sid].player['C']);
			if (SERVERS[sid].player['H']) $("#side_h .name").text(SERVERS[sid].player['H']);
		}
		
		if (map != null) {
			$("#turn").text(map.turn - 1);
			$("#side_c .item").text(map.item['C']);
			$("#side_h .item").text(map.item['H']);
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
				} else if ((i == 0 || i == row - 1) || (j == 0 || j == col - 1)) {
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
		
		$("#board").html(data);
	}
	
	function adjustTable() {
		// Table
		var board = $("#board");
		var col = board.find("tr").eq(1).find("td").length;
		var row = board.find("tr").length;
		
		if (!col) col = 1;
		if (!row) row = 1;
	
		var offset = $("#score").offset();
		var w = ($(window).width() - offset.left * 2) / (col + 1);
		var h = ($(window).height() - offset.top * 3 - $("#turn").outerHeight()) / (row + 1);
		var size = ~~((w < h) ? w : h) - 2;
		
		var slct = board.find("td");
		slct.width(size);
		slct.height(size);
		
		
		// Player
		var padding = ($(window).width() - $("#board")) * 0.45;
		if (padding < 50) padding = 100;
		var wh = $(window).height();
		$.each(["#side_c", "#side_h"], function(i, slct_str) {
			var sh = $(slct_str).height();
			$(slct_str).css('top', (wh - sh) * 0.5).width(padding);
		});
	}
	
	function updateTable(turn, sid, obj, sub, his) {
		var id = window.localStorage.getItem('sid');
		if (sub == null) sub = false;
		if (his == null) his = false;
		
		var object = his ? HISTORIES[sid] : SERVERS[sid];
		
		// update of base map	
		$.each(obj.diff, function(i, val) {
			var d = sub ? -val.add : val.add;

			object.map.data[val.idx] += d;
			if (id == null || sid != id) return true;
			
			var y = ~~(val.idx / object.map.size[0]);
			var x = val.idx - (y * object.map.size[0]);

			var slct = $("#board tr").eq(y + 1).find("td").eq(x + 1);			
			$.each(['floor', 'block', 'item'], function(i, val) {
				if (slct.hasClass(val)) slct.removeClass(val);
			});
			
			var cls = 'block';
			switch(object.map.data[val.idx]) {
			case 0:
			case 1:
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
		});
		
		// update of player positon
		$.each(obj.player, function(side, pos) {
			var before = [].concat(object.map.player[side]);
			object.map.player[side] = pos;
		
			if (id == null || sid != id) return true;
		
			var cls = (side === 'C') ? 'c' : 'h';
			$("#board tr").eq(before[1] + 1).find("td").eq(before[0] + 1).removeClass(cls);
			slct = $("#board tr").eq(pos[1] + 1).find("td").eq(pos[0] + 1).addClass(cls);
		});
		
		
		// update item and turn
		if (id == null || sid != id) return;
		$("#turn").text(turn - 1);
		object.map.turn = turn;
		$("#side_c .item").text(obj.item['C']);
		$("#side_h .item").text(obj.item['H']);
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
		var last = '';
		$.each(SERVERS, function(id, sv) {
			svs.push(id + "("+sv.name+")");
			last = id;
		});
		
		$("#servers").text(svs.join(', '));
		if (!$("#sid").val()) $("#sid").val(last);
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
		if (obj.name) {
			SERVERS[obj.id].player[obj.side] = obj.name;
			
			if (SCORE_FLG && window.localStorage.getItem('sid') == obj.id) {
				var slct_str = (obj.side == 'C') ? 'c' : 'h';
				$("#side_"+slct_str+" .name").text(obj.name);
			}
		}

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
		
		if (SCORE_FLG && window.localStorage.getItem('sid') == obj.id) {
			if (HISTORY_MODE && !(window.confirm('マップ更新が来ました。更新しますか？'))) return;

			makeTable(obj.id, (!SERVERS[obj.id] || !SERVERS[obj.id].map) ? null : SERVERS[obj.id].map);
			adjustTable();
			
			HISTORY_MODE = false;
			if (HISTORIES[obj.id]) delete HISTORIES[obj.id];
		}
	});
	
	SOCKET.on('serverDisconnect', function(obj) {
		noticeConsole('serverDisconnect', obj.id);
		HISTORIES[obj.id].map = $.extend(true, {}, SERVERS[obj.id].map);
		if (SERVERS[obj.id]) { delete SERVERS[obj.id]; }
		updateServerList();
	});
	
	SOCKET.on('serverStart', function(obj) {
		SERVERS[obj.id].playing = true;
		noticeConsole('gameStart', obj.id);
		
		HISTORIES[obj.id] = {'map':SERVERS[obj.id].map, 'history':[]};
	});
	
	SOCKET.on('gameControlError', function(obj) {
		noticeConsole('controlError', obj.id + ", " + obj.msg);
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
				HISTORIES[obj.id] = {'map':new_server.map, 'history':[]};
				noticeConsole('gameStart@init', sid);
			}
			
			SERVERS[sid] = new_server;
			noticeConsole('serverHello@init', sid+":"+sv.name);
		});
		
		updateServerList();
	});
	
	SOCKET.on('clientRequest', function(obj) {
		SERVERS[obj.id].playing = true;
		noticeConsole('clientCommand', obj.id+":("+obj.side+")"+obj.cmd+" is "+((obj.res.state == -1) ? '1' : '0') + obj.res.data.join(''));
		
		if (obj.cmd !== "gr") HISTORIES[obj.id].history[obj.res.turn] = {'diff':obj.res.diff, 'player':obj.res.player, 'item':obj.res.item};
		if (SCORE_FLG && window.localStorage.getItem('sid') == obj.id) {
			if (obj.cmd !== "gr") updateTable(obj.res.turn, obj.id, HISTORIES[obj.id].history[obj.res.turn]);
			$("#result").text(
				(obj.res.state == -1) ? '試合中' :
				(obj.res.state == 0) ? 'Cの勝ち' :
				(obj.res.state == 1) ? 'Hの勝ち' :
				(obj.res.state == 2) ? '引き分け' : '不正');
		}
	});
	
	
	/*------------------------------------*/
	/*               Utility              */
	/*------------------------------------*/
	function zf2(str) { return ("0" + str).slice(-2); }
	
	function noticeConsole(event, msg) {
		var time = new Date();
		var str = "<p>("+zf2(time.getHours())+":"+zf2(time.getMinutes())+":"+zf2(time.getSeconds())+"): "+event+" - "+msg+"</p>";
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