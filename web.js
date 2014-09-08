/******************************************************************************/
/*                                                                            */
/*                                  CHaServer                                 */
/*                               -- WebSocket --                              */
/*                                                                            */
/******************************************************************************/

var ScoreManager = function(io) {
	this.MANAGER = [];
	this.BOARD = [];
	this.SIO = io;
}


ScoreManager.prototype.addManager = function(sock_id){ this.MANAGER.push(sock_id); }
ScoreManager.prototype.delManager = function(sock_id){
	this.MANAGER.some(function(v, i) {
		if (v == sock_id) this.MANAGER.splice(i, 1);
	})
}

function emitEachArray(type, obj, arr) {
	for (var i=0; i<arr.length; i++) {
		SIO.sockets.socket(arr[i]).emit(type, obj);
	}
}

ScoreManager.prototype.emitManager = function(type, obj) { emitEachArr(type, obj, this.MANAGER); };
ScoreManager.prototype.emitBoard = function(type, obj) { emitEachArr(type, obj, this.BOARD); };
ScoreManager.prototype.emitAll = function(type, obj) { this.emitManager(type, obj); this.emitBoard(type, obj); };

ScoreManager.prototype.isManager = function(sock_id) { this.MANAGER.contains(sock_id); }



