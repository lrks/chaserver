/******************************************************************************/
/*                                                                            */
/*                                  CHaServer                                 */
/*                            -- Board prototype --                           */
/*                                                                            */
/******************************************************************************/

/*------------------------------------*/
/*               Prepare              */
/*------------------------------------*/
var Board = function(name) {
	this.name = name;
	this.start_flg = false;
	this.cool = null;
	this.hot = null;
	this.map = null;
}

Board.prototype.setMap = function(map) { this.map = map; }
Board.prototype.setPlayer = function(side, player) {
	if (side === 'C') {
		this.cool = player;
	} else {
		this.hot = player;
	}
}
Board.prototype.setPlayerName = function(side, name) {
	var obj = (side === 'C') ? this.cool : this.hot;
	obj.setName.call(obj, name);
}


/*------------------------------------*/
/*               Control              */
/*------------------------------------*/
Board.prototype.start = function() { this.start_flg = true; }
Board.prototype.stop = function() { this.start_flg = false; }
Board.prototype.isReady = function() { return (!(this.cool == null) && !(this.hot == null) && !(this.map == null)); }
Board.prototype.isStart = function() { return (this.isReady() && this.start_flg); }
Board.prototype.isStop = function() { return !this.isStart(); }


/*------------------------------------*/
/*               Command              */
/*------------------------------------*/
Board.prototype.command = function(side, cmd) {
	var obj = {};
	obj.state = this.isStart() ? this.map.checkEnd() : 2;
	var before = [].concat(this.map.getAllData());
	var f;
	
	// run command
	switch(cmd) {
	case 'gr':
		this.map.eatTurn();
		f = this.map.data4getReady;
		break;
	case 'lr':
		f = this.map.data4lookRight;
		break;
	case 'll':
		f = this.map.data4lookLeft;
		break;
	case 'lu':
		f = this.map.data4lookUp;
		break;
	case 'ld':
		f = this.map.data4lookDown;
		break;
	case 'sr':
		f = this.map.data4searchRight;
		break;
	case 'sl':
		f = this.map.data4searchLeft;
		break;
	case 'su':
		f = this.map.data4searchUp;
		break;
	case 'sd':
		f = this.map.data4searchDown;
		break;
	default:
		f = this.map.data4getReady;
		if (obj.state === -1) {
			var f2 = null;
			
			switch(cmd) {
			case 'pr':
				f2 = this.map.work4putRight;
				break;
			case 'pl':
				f2 = this.map.work4putLeft;
				break;
			case 'pu':
				f2 = this.map.work4putUp;
				break;
			case 'pd':
				f2 = this.map.work4putDown;
				break;
			case 'wr':
				f2 = this.map.work4walkRight;
				break;
			case 'wl':
				f2 = this.map.work4walkLeft;
				break;
			case 'wu':
				f2 = this.map.work4walkUp;
				break;
			case 'wd':
				f2 = this.map.work4walkDown;
				break;
			}
			
			if (f2 != null) f2.call(this.map, side);
		}
	}
	
	// get result
	obj.data = f.call(this.map, side);
	obj.state = this.map.checkEnd();
	
	// take diff
	obj.diff = [];
	var after = this.map.getAllData();
	var len = before.length;
	for (var i=0; i<len; i++) {
		var diff = after[i] - before[i];
		if (diff !== 0) obj.diff.push({'idx':i, 'add':diff});
	}
	
	// player
	obj.player = this.map.getPlayerPosition();
	obj.item = this.map.getItem();
	
	// turn
	obj.turn = this.map.turn;
	
	return obj;
}


/*------------------------------------*/
/*                Error               */
/*------------------------------------*/
Board.prototype.error = function(side, msg) { this.stop(); }

module.exports = { Board: Board }
