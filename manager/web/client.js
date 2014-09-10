/******************************************************************************/
/*                                                                            */
/*                                  CHaServer                                 */
/*                                -- Manager --                               */
/*                                                                            */
/******************************************************************************/
$(function() {
	/**************************************/
	/*              WebSocket             */
	/**************************************/
	var SOCKET = io.connect(null, {port:3000});

	/* 受信側 */
	SOCKET.on('serverHello', function(obj) {
		console.log('繋いできた', obj);	
	});
	
	SOCKET.on('clientHello', function(obj) {
		console.log('クライアントが繋いできた', obj);
	});
	
	SOCKET.on('clientRequest', function(obj) {
		console.log('ゲーム試合中', obj);
	});
	
	SOCKET.on('clientError', function(obj) {
		console.log('なんかエラーだって', obj);
	});
	
	SOCKET.on('getMap', function(obj) {
		console.log('マップ', obj);
	});
	
	SOCKET.on('errorMap', function(obj) {
		console.log('マップエラー', obj);
	});
	
	
	/* 送信側 */
	SOCKET.emit('connectManager');
	
	$("#start_button").click(function() {
		var id = $("#socket_id").val();
		SOCKET.emit('gameControl', {'id':id, 'msg':'start'});
	});
	
	$("#stop_button").click(function() {
		var id = $("#socket_id").val();
		SOCKET.emit('gameControl', {'id':id, 'msg':'stop'});
	});
	
	$("#map_button").click(function() {
		var id = $("#socket_id").val();
		var map = $("#map_data").val();
		SOCKET.emit('setMap', {'id':id, 'map':map});
	});
});