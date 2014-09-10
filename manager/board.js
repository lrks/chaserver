/******************************************************************************/
/*                                                                            */
/*                                  CHaServer                                 */
/*                            -- Board prototype --                           */
/*                                                                            */
/******************************************************************************/

/*------------------------------------*/
/*               Prepare              */
/*------------------------------------*/
var Board = function(name) { this.name = name; }
Board.prototype.setMap = function(map) { this.map = map; }
Board.prototype.setPlayer = function(side, player) {
	if (side === 'C') {
		this.cool = player;
	} else {
		this.hot = player;
	}
}


/*------------------------------------*/
/*               Control              */
/*------------------------------------*/
Board.prototype.start = function() { this.start = true; }
Board.prototype.stop = function() { this.start = false; }
Board.prototype.isStart = function() { return this.start; }
Board.prototype.isReady = function() {
	if (!this.cool) return false;
	if (!this.hot) return false;
	if (!this.map) return false;
	if (!this.isStart()) return false;
	return true;
}


/*------------------------------------*/
/*               Command              */
/*------------------------------------*/
Board.prototype.command = function(side, cmd) {
	var obj = {};
	obj.state = this.map.checkEnd();
	var before = this.map.getAllData();
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
			switch(cmd) {
			case 'pr':
				this.map.work4putRight(side);
				break;
			case 'pl':
				this.map.work4putLeft(side);
				break;
			case 'pu':
				this.map.work4putUp(side);
				break;
			case 'pd':
				this.map.work4putDown(side);
				break;
			case 'wr':
				this.map.work4walkRight(side);
				break;
			case 'wl':
				this.map.work4walkLeft(side);
				break;
			case 'wu':
				this.map.work4walkUp(side);
				break;
			case 'wd':
				this.map.work4walkDown(side);
				break;
			}
		}
	}
	
	// get result
	obj.data = f(side);
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
