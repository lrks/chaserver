/******************************************************************************/
/*                                                                            */
/*                                  CHaServer                                 */
/*                                 -- Game --                                 */
/*                                                                            */
/******************************************************************************/
var COOL = null;
var HOT = null;
var MAP = null;


/*------------------------------------*/
/*            Game Control            */
/*------------------------------------*/
// NEW CONNECTION!
function newGame(socket, cool_port, hot_port) {
	if (MAP == null) {
		endSocket(socket, "Empty map");
		return null;
	}
	
	if (socket.localPort == cool_port) {
		if (COOL != null) {
			endSocket(socket, "Not accepted")
			return null;
		}
		
		COOL = socket;
		console.log("COOL: " + socket.remoteAddr + ":" + socket.remotePort);
		return socket;
	}
	
	if (socket.localPort == hot_port) {
		if (HOT != null) {
			endSocket(socket, "Not accepted")
			return null;
		}
		
		HOT = socket;
		console.log("HOT: " + socket.remoteAddr + ":" + socket.remotePort);
		return socket;
	}
	
	endSocket(socket, "Unknown Error")
	return null;
}

// Close socket
function endSocket(socket, msg) {
		var write = msg + ": " + socket.remoteAddr + ":" + socket.remotePort;
		console.log(write);
		socket.write(write);
		socket.end();
}

// END Game
function endGame() {
	endSocket(COOL, "gameEnd");
	endSocket(HOT, "gameEnd");
	
	COOL = null;
	HOT = null;
}


/*------------------------------------*/
/*               CHaser               */
/*------------------------------------*/
function game(socket, line) {



}


/*------------------------------------*/
/*               Utility              */
/*------------------------------------*/
function getCH() {
	return [ COOL, HOT ];
}



module.exports = {
	newGame: newGame,
	game:game,
	endGame: endGame,
	getCH: getCH
}