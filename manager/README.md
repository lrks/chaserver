CHaserver Manager
================
ServerとBrowser間を中継する。

## Browser -> Manager

Socket.io イベント。

* connectManager
  - 繋ぐときに。
  - 接続時に接続したことが通知されるので、別に要らないが、例えば「スコア表示専用と管理専用に分けよう」としたときなどの将来の拡張に備えて。

* gameControl
  - obj.msg に "start" or "stop" で操作。
  - obj.id でサーバのID指定。
  - 場合により、gameControlErrorイベントが返ってくることも。
  
* setMapRequest
  - マップをセット。
  - obj.map に マップデータそのまま
  - obj.id にサーバID
  - setMapResponse イベントを発する
  
* disconnect
  - まぁええやろ
  
  
## Manager -> Browser

これもSocket.ioイベント。
  
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
   
* initialize
   - 手持ちのServer情報をBrowserへ通知。

* setMapRequest
   - setされたマップをパースしてオブジェクトにして通知
   - パースできないときは、エラーが入っている。

* gameControlError
  - 制御に失敗したとき。
