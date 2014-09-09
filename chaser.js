/******************************************************************************/
/*                                                                            */
/*                                  CHaServer                                 */
/*                                 -- Game --                                 */
/*                                                                            */
/******************************************************************************/
var map_manager = require('./map');
var events = require('events');


/*------------------------------------*/
/*             Initialize             */
/*------------------------------------*/
var NewGame = function(score_manager, cool_port, hot_port) {
	this.SM = score_manager;
	this.BASE_MAP = null;
	this.COOL = null;
	this.HOT = null;
	this.COOL_NAME = null;
	this.HOT_NAME = null;
	this.MAP = null;
	this.COOL_PORT = cool_port;
	this.HOT_PORT = hot_port;
	this.RUNNNING = false;
	this.COOL_GR = false;
	this.HOT_GR = false;
}


/*------------------------------------*/
/*             Connection             */
/*------------------------------------*/
NewGame.prototype.connection = function(sock) {	
	if (sock.localPort == this.COOL_PORT) {
		if (this.COOL != null) {
			reject(sock, 'COOL is already connected.');
			return false;
		}
		
		this.COOL = sock;
		return true;
	}
	
	if (sock.localPort == this.HOT_PORT) {
		if (this.HOT != null) {
			reject(sock, 'HOT is already connected.');
			return false;
		}
		
		this.HOT = sock;
		return true;
	}
	
	reject(sock, 'Unknown');
	return false;
}

function resume(sock) {
	sock.resume();
	
	var ev = new events.EventEmitter;
	ev.emit('data', '');
}

/*------------------------------------*/
/*                Main                */
/*------------------------------------*/
NewGame.prototype.command = function(sock, line) {
	var is_hot = isHot(sock);

	// Name
	if (!this.RUNNING && line != "gr") {
		if (is_hot) {
			this.HOT_NAME = line;
		} else {
			this.COOL_NAME = line;
		}
		
		return true;
	}

	// getReady
	if (line == "gr") {
		if (is_hot) {
			this.HOT_GR = true;
			accept(sock, 'HOT');
		} else {
			this.COOL_GR = true;
			accept(sock, 'COOL');
		}
		
		return false;
	}
	
	// walkRight
	if (line == "wr") {
		if (
	
	
	}
	
	
	
	
	



	// gr of first, and name
	if (!this.RUNNING) {
		if (line == "gr") {
			if (isHot(sock)) {
				this.HOT_GR = true;
				accept(sock, 'HOT');
			} else {
				this.COOL_GR = true;
				accept(sock, 'COOL');
			}
			socket.pause();
		} else {
			if (isHot(sock)) {
				this.HOT_NAME = line;
			} else {
				this.COOL_NAME = line;
			}
		}
	}
	
	// other
	
	
		if (isHot(sock)) {
			
		
		
		}
		
		

	if (line == "gr"



	if (!this.RUNNING) {
		if (isHot(sock)) {
			this.HOT_NAME = line;
		} else {
			this.COOL_NAME = line;
		}
	}


	// getReady()
	






}


/*------------------------------------*/
/*               Closing              */
/*------------------------------------*/
NewGame.prototype.close = function(sock) {
	SM.emitManager('disconnect', {
		'msg' : (isHot(sock) ? 'HOT' : 'COOL') + 'disconnect'
	});
	this.end();
}


/*------------------------------------*/
/*             Start / End            */
/*------------------------------------*/
NewGame.prototype.start = function() {
	if (this.HOT == null || this.COOL == null) {
		reject('Player is empty');
		return false;
	}
	
	if (!(this.HOT_GR && this.COOL_GR) {
		reject('Player is not ready');
	}

	if (this.RUNNNING) {
		reject('It is running.');
		return false;
	}
	
	if (this.BASE_MAP == null) {
		reject('Map is empty.')
		return false;
	} else if (this.MAP == null) {
		this.updateMap(BASE_MAP);
	}
	
	if (this.HOT_NAME == null) this.HOT_NAME = "HOT";
	if (this.COOL_NAME == null) this.COOL_NAME = "COOL";
	
	this.COOL.write("0" + this.MAP.data4getReady('C').join());
	this.COOL_GR = false;
	resume(this.COOL);
	
	//this.HOT.write("0" + this.MAP.data4getReady('H').join());
	
	this.RUNNING = true;
}

NewGame.prototype.end = function() {
	this.HOT.end();
	this.COOL.end();
	this.HOT = null;
	this.COOL = null;
	this.MAP = null;
	this.RUNNING = false;
	this.COOL_NAME = null;
	this.HOT_NAME = null;
	this.COOL_GR = false;
	this.HOT_GR = false;
}


/*------------------------------------*/
/*             Map Control            */
/*------------------------------------*/
NewGame.prototype.updateMap = function(map) {
	if (this.RUNNING) {
		reject('It is running');
		return false;
	}
	
	try {
		this.MAP = new map_manager.GameMap(map);
		this.BASE_MAP = map;
	} catch(e) {
		reject(e.message);
		return false;
	}
	
	return true;
}


/*------------------------------------*/
/*          Private function          */
/*------------------------------------*/
function event(type, obj) { this.SM.emitManager(event, obj); }
function event(type, sock, msg) {
	event(type, {
		'msg':msg,
		'addr':sock.remoteAddr,
		'port':sock.remotePort
	});
}
function accept(sock, msg) { event('Accept', sock, msg); }
function accept(msg) { event('Accept', {'msg':msg}); }
function reject(sock, msg) {
	event('Reject', sock, msg);
	sock.end();
}
function reject(msg) { event('Reject', {'msg':msg}) }
function isHot(sock) { return this.HOT == sock; }
function isCool(sock) { return !isHot(sock); }

module.exports = { NewGame: NewGame }
