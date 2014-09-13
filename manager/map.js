/******************************************************************************/
/*                                                                            */
/*                                  CHaServer                                 */
/*                                  -- map --                                 */
/*                                                                            */
/******************************************************************************/
var TYPE_FLOOR = 0;
var TYPE_CHARACTOR = 1;
var TYPE_BLOCK = 2;
var TYPE_ITEM = 3;

/*------------------------------------*/
/*             Initialize             */
/*------------------------------------*/
var GameMap = function(map) {
	this.name = null;
	this.size = null;
	this.turn = null;
	this.data = null;
	this.player = {'C':null, 'H':null};
	this.item = {'C':0, 'H':0};
	
	var lines = map.split(/\r?\n/);
	var d_first = true;
	for (var i=0; i<lines.length; i++) {
		if (lines[i].charAt(1) != ":") continue;
		
		switch(lines[i].charAt(0)) {
		case 'N':
			this.name = lines[i].substring(2).trim();
			break;
		case 'S':
			var tmp = lines[i].substring(2).split(",");
			if (tmp.length != 2) throw new Error("Map line " + i + ": Length is invalid.");
			for (var j=0; j<2; j++) {
				tmp[j] = tmp[j].trim();
				if (!isFinite(tmp[j])) throw new Error("Map line " + i + ": Not a number.");
				if (tmp[j] < 0) throw new Error("Map line " + i + ": Range is invalid.");
			}
			this.size = [ parseInt(tmp[0]), parseInt(tmp[1]) ];
			break;
		case 'T':
			this.turn = lines[i].substring(2).trim();
			if (!isFinite(this.turn)) throw new Error("Map line " + i + ": Not a number.");
			if (this.turn < 0) throw new Error("Map line " + i + ": Range is invalid.");
			if (this.turn % 2 != 0) throw new Error("Map line " + i + ": Number is not divisible.");
			this.turn = parseInt(this.turn);
			break;
		case 'D':
			if (d_first) {
				this.data = [];
				d_first = false;
			}
			
			var tmp = lines[i].substring(2).split(",");
			for (var j=0; j<tmp.length; j++) {
				tmp[j] = parseInt(tmp[j].trim());
				if (!(0 <= tmp[j] && tmp[j] <= 3)) throw new Error("Map line " + i + ": Range is invalid.");
				this.data.push(tmp[j]);
			}
			break;
		case 'C':
		case 'H':
			this.player[lines[i].charAt(0)] = [];
			
			var tmp = lines[i].substring(2).split(",");
			if (tmp.length != 2) throw new Error("Map line " + i + ": Length is invalid.");
			for (var j=0; j<2; j++) {
				tmp[j] = tmp[j].trim()
				if (!isFinite(tmp[j])) throw new Error("Map line " + i + ": Not a number.");
				if (tmp[j] < 0) throw new Error("Map line " + i + ": Range is invalid.");
				this.player[lines[i].charAt(0)].push(parseInt(tmp[j]));
			}
			break;
		}
	}
		
	if (!this.name) throw new Error("Map: Name is empty.");
	if (!this.size) throw new Error("Map: Size is empty.");
	if (!this.turn) throw new Error("Map: Turn is empty.");
	if (!this.data) throw new Error("Map: Data is empty.");
	if (!this.player['C']) throw new Error("Map: Cool is empty.");
	if (!this.player['H']) throw new Error("Map: Hot is empty.");
	if (this.data.length != (this.size[0] * this.size[1])) throw new Error("Map: Length of Data does not match size.");
}

GameMap.prototype.getData = function(x, y) { return this.data[this.getIndex(x, y)]; }
GameMap.prototype.setData = function(x, y, d) { this.data[this.getIndex(x, y)] = d; }
GameMap.prototype.getIndex = function(x, y) { return y*this.size[0] + x; }

/*------------------------------------*/
/*         Map data for client        */
/*------------------------------------*/
GameMap.prototype.chaserData = function(plyer, callback) {
	var data = new Array(9);
	for (var i=0; i<9; i++) {
		var position = callback(i);
		for (var j=0; j<2; j++) position[j] = parseInt(position[j]) + parseInt(this.player[plyer][j]);
		
		//console.log(i, position);
		
		if (!(0 <= position[0] && position[0] < this.size[0])) {
			data[i] = TYPE_BLOCK;
		} else if (!(0 <= position[1] && position[1] < this.size[1])) {
			data[i] = TYPE_BLOCK;
		} else {
			if (isCharactor(position[0], position[1], this.player['C']) || isCharactor(position[0], position[1], this.player['H'])) {
				data[i] = TYPE_CHARACTOR;
			} else {
				data[i] = this.getData(position[0], position[1]);
			}
		}
	}

	return data;
}

GameMap.prototype.data4searchRight = function(plyer){ return this.chaserData(plyer, function(i) { return [ i + 1, 0 ]; })};
GameMap.prototype.data4searchLeft = function(plyer){ return this.chaserData(plyer, function(i) { return [ -(i + 1), 0 ]; })};
GameMap.prototype.data4searchUp = function(plyer){ return this.chaserData(plyer, function(i) { return [ 0, -(i + 1) ]; })};
GameMap.prototype.data4searchDown = function(plyer){ return this.chaserData(plyer, function(i) { return [ 0, i + 1 ]; })};
GameMap.prototype.data4lookRight = function(plyer){ return this.chaserData(plyer, function(i) { return [ (i % 3) + 1, Math.floor(i/3) - 1 ]; })};
GameMap.prototype.data4lookLeft = function(plyer){ return this.chaserData(plyer, function(i) { return [ (i % 3) - 3, Math.floor(i/3) - 1 ]; })};
GameMap.prototype.data4lookUp = function(plyer){ return this.chaserData(plyer, function(i) { return [ (i % 3) - 1, Math.floor(i/3) - 3 ]; })};
GameMap.prototype.data4lookDown = function(plyer){ return this.chaserData(plyer, function(i) { return [ (i % 3) - 1, Math.floor(i/3) + 1 ]; })};
GameMap.prototype.data4getReady = function(plyer){ return this.chaserData(plyer, function(i) { return [ (i % 3) - 1, Math.floor(i/3) - 1 ]; })};


/*------------------------------------*/
/*              Put block             */
/*------------------------------------*/
GameMap.prototype.putBlock = function(plyer, position) {
	for (var j=0; j<2; j++) position[j] += this.player[plyer][j];
	
	if (!(0 <= position[0] && position[0] < this.size[0]) || !(0 <= position[1] && position[1] < this.size[1])) {
		return;
	}
	
	this.setData(position[0], position[1], TYPE_BLOCK);
}

GameMap.prototype.work4putRight = function(plyer){ this.putBlock(plyer, [1, 0]) };
GameMap.prototype.work4putLeft = function(plyer){ this.putBlock(plyer, [-1, 0]) };
GameMap.prototype.work4putUp = function(plyer){ this.putBlock(plyer, [0, -1]) };
GameMap.prototype.work4putDown = function(plyer){ this.putBlock(plyer, [0, 1]) };


/*------------------------------------*/
/*                Walk                */
/*------------------------------------*/
GameMap.prototype.walkPlayer = function(plyer, position) {
	var now = this.player[plyer];
	for (var j=0; j<2; j++) position[j] += now[j];
	if (!(0 <= position[0] && position[0] < this.size[0]) || !(0 <= position[1] && position[1] < this.size[1])) {
		return;
	}
	
	if (this.getData(position[0], position[1]) === TYPE_ITEM) {
		this.item[side] += 1;
		this.setData(now[0], now[1], TYPE_BLOCK);
	}
	
	this.setData(position[0], position[1], TYPE_CHARACTOR);
	this.player[plyer] = position;
}

GameMap.prototype.work4walkRight = function(plyer){ this.walkPlayer(plyer, [1, 0]) };
GameMap.prototype.work4walkLeft = function(plyer){ this.walkPlayer(plyer, [-1, 0]) };
GameMap.prototype.work4walkUp = function(plyer){ this.walkPlayer(plyer, [0, -1]) };
GameMap.prototype.work4walkDown = function(plyer){ this.walkPlayer(plyer, [0, 1]) };


/*------------------------------------*/
/*              Game End              */
/*------------------------------------*/
GameMap.prototype.isBlock = function(x, y) { return this.getData(x, y) === TYPE_BLOCK; }

GameMap.prototype.isStuck = function(plyer) {
	var x = this.player[plyer][0];
	var y = this.player[plyer][1];

	if (!this.isBlock(x, y - 1)) return false;
	if (!this.isBlock(x + 1, y)) return false;
	if (!this.isBlock(x, y + 1)) return false;
	if (!this.isBlock(x - 1, y)) return false;
	
	return true;
}

GameMap.prototype.isDeath = function(plyer) {
	var x = this.player[plyer][0];
	var y = this.player[plyer][1];
	
	if (!(0 <= x && x < this.size[0])) return true;
	if (!(0 <= y && y < this.size[1])) return true;
	if (this.isBlock(x, y)) return true;

	return false;
}

GameMap.prototype.checkEnd = function() {
	/* 返り値
	 * -1 => 試合中
	 *  0 => Cの勝ち
	 *  1 => Hの勝ち
	 *  2 => 引き分け
	 */

	var c_lose = this.isStuck('C') || this.isDeath('C');
	var h_lose = this.isStuck('H') || this.isDeath('H');
		
	if (c_lose && h_lose) return 2;
	if (c_lose) return 1;
	if (h_lose) return 0;
	if (this.turn > 0) return -1;
	
	if (this.item['C'] === this.item['H']) return 2;
	return (this.item['C'] > this.item['H']) ? 0 : 1;
}


/*------------------------------------*/
/*                Turn                */
/*------------------------------------*/
GameMap.prototype.eatTurn = function() {
	if (this.turn <= 0) return;
	this.turn--;
}


/*------------------------------------*/
/*       Notification to manager      */
/*------------------------------------*/
GameMap.prototype.getAllData = function() { return this.data; }
GameMap.prototype.getPlayerPosition = function() { return {'C':this.player['C'], 'H':this.player['H']}; }
GameMap.prototype.getItem = function() { return {'C':this.item['C'], 'H':this.item['H']}; }


/*------------------------------------*/
/*          Private function          */
/*------------------------------------*/
function isCharactor(x, y, plyer_pos) { return (plyer_pos[0] === x && plyer_pos[1] === y); }

module.exports = { GameMap: GameMap }
