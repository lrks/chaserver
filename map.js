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
	this.NAME = null;
	this.SIZE = null;
	this.TURN = null;
	this.DATA = null;
	this.PLAYER = {'C':null, 'H':null};
	
	var lines = map.split(/\r?\n/);
	var d_first = true;
	for (var i=0; i<lines.length; i++) {
		if (lines[i].charAt(1) != ":") continue;
		
		switch(lines[i].charAt(0)) {
		case 'N':
			this.NAME = lines[i].substring(2).trim();
			break;
		case 'S':
			var tmp = lines[i].substring(2).split(",");
			if (tmp.length != 2) throw new Error("Map line " + i + ": Length is invalid.");
			for (var j=0; j<2; j++) {
				tmp[j] = tmp[j].trim();
				if (!isFinite(tmp[j])) throw new Error("Map line " + i + ": Not a number.");
				if (tmp[j] < 0) throw new Error("Map line " + i + ": Range is invalid.");
			}
			this.SIZE = [ tmp[0], tmp[1] ];
			break;
		case 'T':
			this.TURN = lines[i].substring(2).trim();
			if (!isFinite(this.TURN)) throw new Error("Map line " + i + ": Not a number.");
			if (this.TURN < 0) throw new Error("Map line " + i + ": Range is invalid.");
			if (this.TURN % 2 != 0) throw new Error("Map line " + i + ": Number is not divisible.");
			break;
		case 'D':
			if (d_first) {
				this.DATA = [];
				d_first = false;
			}
			
			var tmp = lines[i].substring(2).split(",");
			for (var j=0; j<tmp.length; j++) {
				tmp[j] = tmp[j].trim();
				if (!(0 <= tmp[j] && tmp[j] <= 3)) throw new Error("Map line " + i + ": Range is invalid.");
				this.DATA.push(tmp[j]);
			}
			break;
		case 'C':
		case 'H':
			this.PLAYER[lines[i].charAt(0)] = [];
			
			var tmp = lines[i].substring(2).split(",");
			if (tmp.length != 2) throw new Error("Map line " + i + ": Length is invalid.");
			for (var j=0; j<2; j++) {
				tmp[j] = tmp[j].trim()
				if (!isFinite(tmp[j])) throw new Error("Map line " + i + ": Not a number.");
				if (tmp[j] < 0) throw new Error("Map line " + i + ": Range is invalid.");
				this.PLAYER[lines[i].charAt(0)].push(tmp[j]);
			}
			break;
		}
	}
		
	if (!this.NAME) throw new Error("Map: Name is empty.");
	if (!this.SIZE) throw new Error("Map: Size is empty.");
	if (!this.TURN) throw new Error("Map: Turn is empty.");
	if (!this.DATA) throw new Error("Map: Data is empty.");
	if (!this.PLAYER['C']) throw new Error("Map: Cool is empty.");
	if (!this.PLAYER['H']) throw new Error("Map: Hot is empty.");
	if (this.DATA.length != (this.SIZE[0] * this.SIZE[1])) throw new Error("Map: Length of Data does not match size.");
}

/*------------------------------------*/
/*          Private function          */
/*------------------------------------*/
function getIndex(x, y) { return y*3 + 1; }
function getData(x, y) { return this.DATA[getIndex(x, y)]; }
function setData(x, y, d) { this.DATA[getIndex(x, y)] = d; }
function checkPlayer(CH) { if (CH != 'C' && CH != 'H') throw new Error("Player is invalid."); }

/*------------------------------------*/
/*               Getter               */
/*------------------------------------*/
GameMap.prototype.isFloor = function(x, y) { return getData(x, y) == TYPE_FLOOR; }
GameMap.prototype.isBlock = function(x, y) { return getData(x, y) == TYPE_BLOCK; }
GameMap.prototype.isItem = function(x, y) { return getData(x, y) == TYPE_ITEM; }
GameMap.prototype.isCharactor = function(x, y, CH) {
	if (this.PLAYER[CH][0] == x && this.PLAYER[CH][1] == y) return true;
	return false;
}

/*------------------------------------*/
/*               Setter               */
/*------------------------------------*/
GameMap.prototype.setFloor = function(x, y) { setData(x, y, TYPE_FLOOR); }
GameMap.prototype.setBlock = function(x, y) { setData(x, y, TYPE_BLOCK); }
GameMap.prototype.setItem = function(x, y) { setData(x, y, TYPE_ITEM); }


/*------------------------------------*/
/*                Move                */
/*------------------------------------*/
GameMap.prototype.move = function(x, y, CH) {
	checkPlayer(CH);
	
	if (isItem(x, y)) {
		this.setBlock(this.PLAYER[CH][0], this.PLAYER[CH][1]);
	}

	this.PLAYER[CH][0] = x;
	this.PLAYER[CH][1] = y;
	
	return getData(x, y);
}


/*------------------------------------*/
/*           CHaser Command           */
/*------------------------------------*/
function chaserData(CH, callback) {
	checkPlayer(CH);
	var data = new Array(9);
	for (var i=0; i<9; i++) {
		var position = callback(i);
		for (var j=0; j<2; j++) position[j] = this.PLAYER[CH][j];
		
		if (position[0] < 0 || position[0] >= this.SIZE[0]) {
			data[i] = TYPE_BLOCK;
		} else if (position[1] < 0 || position[1] >= this.SIZE[1]) {
			data[i] = TYPE_BLOCK;
		} else {
			if (this.isCharactor(x, y, 'C') || this.isCharactor(x, y, 'H')) {
				data[i] = TYPE_CHARACTOR;
			} else {
				data[i] = getData(x, y);
			}
		}
	}

	return data;
}

GameMap.prototype.data4searchRight = function(CH){chaserData(CH, function(i) { return [ i + 1, 0 ]; })};
GameMap.prototype.data4searchLeft = function(CH){chaserData(CH, function(i) { return [ -(i + 1), 0 ]; })};
GameMap.prototype.data4searchUp = function(CH){chaserData(CH, function(i) { return [ 0, i + 1 ]; })};
GameMap.prototype.data4searchDown = function(CH){chaserData(CH, function(i) { return [ 0, -(i + 1) ]; })};
GameMap.prototype.data4lookRight = function(CH){chaserData(CH, function(i) { return [ (i % 3) + 1, Math.floor(i/3) - 1 ]; })};
GameMap.prototype.data4lookLeft = function(CH){chaserData(CH, function(i) { return [ (i % 3) - 3, Math.floor(i/3) - 1 ]; })};
GameMap.prototype.data4lookUp = function(CH){chaserData(CH, function(i) { return [ (i % 3) - 1, Math.floor(i/3) - 3 ]; })};
GameMap.prototype.data4lookDown = function(CH){chaserData(CH, function(i) { return [ (i % 3) - 1, Math.floor(i/3) + 1 ]; })};
GameMap.prototype.data4getReady = function(CH){chaserData(CH, function(i) { return [ Math.floor(i/3) - 1, (i % 3) - 1 ]; })};


/*------------------------------------*/
/*              Game End              */
/*------------------------------------*/
GameMap.prototype.isStuck = function(CH) {
	var x = this.PLAYER[CH][0];
	var y = this.PLAYER[CH][1];

	if (!this.isBlock(x, y - 1)) return false;
	if (!this.isBlock(x + 1, y)) return false;
	if (!this.isBlock(x, y + 1)) return false;
	if (!this.isBlock(x - 1, y)) return false;
	
	return true;
}

GameMap.prototype.isDeath = function(CH) {
	var x = this.PLAYER[CH][0];
	var y = this.PLAYER[CH][1];
	
	if (x < 0 || x >= this.SIZE[0]) return true;
	if (y < 0 || y >= this.SIZE[1]) return true;
	if (this.isBlock(x, y) && this.isCharactor(x, y, CH)) return true;

	return false;
}
