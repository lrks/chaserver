CHaserver Server
=================

Server部。通常のクライアントの接続を受け、Managerへ流す。

## Server -> Manager

HTTPで処理する。

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
