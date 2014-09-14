chaserver
=========

## Server から Manager へ(HTTP)

* (POST) /serverHello
  - 最初に繋ぐときに言う
  - (body)id : 適当に決めたサーバ固有のID
  - (body)name : サーバの名前

* (POST) /clientHello
  - クライアントが繋いできたら言う
  - ただ繋いだだけのときは「id, side, addr, port」のみ、名前送ってきたら「id, side, name」を送ってくる
  - (body)id : serverHelloしたサーバのID
  - (body)side : C or H
  - (body)name : クライアント名
  - (body)addr : クライアントのアドレス
  - (body)port : クライアントのポート

* (POST) /serverStart
  - 開始したことを通知する
  - (body)id : serverHelloしたサーバのID

* (POST) /clientRequest
  - クライアントからの電文
  - (body)id : serverHelloしたサーバのID
  - (body)side: C or H
  - (body)cmd : gr とか wd とか pl とか
  - 「result:01000100222」とかいうJSONを返すので、これをクライアントに教えてあげる

* (POST) /clientError
  - クライアント側のエラー…のつもりが、サーバエラーでも作動。
  - (body)id : serverHelloしたサーバのID
  - (body)side : エラーを起こしたときに処理中だった C or H
  - (body)msg : 何かの手助けになるかも

* (POST) /serverDisconnect
  - 終わったら教える。
  - (body)id : serverHelloしたサーバのID
  - そのサーバIDは抹消される。

* (GET) /isStart
  - スタートしたかなーというもの
  - (query)id : serverHelloしたサーバのID
  - 「{'flg':0 or 1}」のJSONを返す
  
  
  
## ブラウザ から Manager へ(Socket.ioイベント)

* connectManager
  - 繋いできた
  - Managerが持っているサーバの情報をinitializeイベントで通知
  
* gameControl
  - obj.msg に start or stop で操作。
  - obj.id でサーバのID指定。
  
* setMapRequest
  - マップをセット。
  - obj.map に マップデータそのまま
  - obj.id にサーバID
  - setMapResponse イベントを発する
  
* disconnect
  - まぁええやろ
  
  
## Manager から ブラウザへ(Socket.ioイベント)
  
* serverHello
   - POSTの serverHello を横流し
   - bodyはobjになります。以下横流し系は同様。
   
* clientHello
   - 横流し
   
* serverStart
   - 横流し
   
* clientRequest
   - 基本横流し
   - マップ更新情報などの詳細なレスポンスも追加

* clientError
   - 横流し
   
* serverDisconnect
   - 横流し

* setMapRequest
   - setされたマップをパースしてオブジェクトにして通知
   - パースできないときは、エラーが入っている。


## TODO
* 再現機能
* ステップ実行
* 履歴機能
* CHaserの仕様に微妙に沿っていないクライアントへの対応
* 接続時、リアルタイム受付。
* Log機能
* 試合制御に失敗したときの通知
* ServerID、クリックしたら入力されるとかよさそう
