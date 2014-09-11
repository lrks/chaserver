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
		console.log('繋いできた');
		console.log(obj);
	});
	
	SOCKET.on('clientHello', function(obj) {
		console.log('クライアントが繋いできた');
		console.log(obj);
	});
	
	SOCKET.on('clientRequest', function(obj) {
		console.log('ゲーム試合中');
		console.log(obj);
	});
	
	SOCKET.on('clientError', function(obj) {
		console.log('なんかエラーだって');
		console.log(obj);
	});
	
	SOCKET.on('getMap', function(obj) {
		console.log('マップ');
		console.log(obj);
	});
	
	SOCKET.on('errorMap', function(obj) {
		console.log('マップエラー');
		console.log(obj);
	});
	
	SOCKET.on('serverDisconnect', function(obj) {
		console.log('きった');
		console.log(obj);
	});
	
	SOCKET.on('serverStart', function(obj) {
		console.log('ゲーム開始');
		console.log(obj);
	});
	
	SOCKET.on('initialize', function(obj) {
		console.log('初期化');
		console.log(obj);
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