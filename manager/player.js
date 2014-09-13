/******************************************************************************/
/*                                                                            */
/*                                  CHaServer                                 */
/*                           -- Player prototype --                           */
/*                                                                            */
/******************************************************************************/

/*------------------------------------*/
/*             Initialize             */
/*------------------------------------*/
var Player = function(addr, port) {
	this.name = null;
	this.addr = addr;
	this.port = port;
}
Player.prototype.setName = function(name){ this.name = name };

module.exports = { Player: Player }
