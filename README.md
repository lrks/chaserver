CHaserver
=========

CHaserのまともなサーバを作ろうと思ったら、微妙なものができた。


## 構成要素

* Server
    - CHaserクライアントからの接続を受け付ける
	- コマンドをManagerへ横流し
* Manager
    - Serverからのコマンドを処理して、クライアント用の結果(1000210222 とか)を返す
	- Browserからの指示も受ける
	- 中核
* Browser
    - 普通のブラウザ
	- Managerへ指示
	- ManagerのManager?
	- スコアもこっちで表示


## インストール

1. node と npm を入れる
2. npm で socket.io をインストール
3. このrepositoryをcone
4. node manager/manager.js
5. まともそうなブラウザから http://(hogehoge):3000/ へアクセス
6. python server/server.py
7. ブラウザを見ると、「testserverが繋いできた」的なことが書かれているので、「ServerID:testserver」として入力
8. マップをコピペして送信
9. CHaserのクライアントから (hogehoge):40000 とか :50000 へ接続
10. ブラウザの「開始」
11. 「Score」で眺める

## 隠し機能

### 管理画面

* ログがいっぱい出る

### Score画面

* M(大文字) を押下すると、元の画面に戻る
* 試合終了後、「←」を押下すると、1ターン前に戻れる
* もちろん「→」も使える

### 共通

* ブラウザのコンソールにいろいろ書かれる


## 動作確認

あまりやっていません。
Pythonのバージョンは、2.7系でした。


## 既存クライアントとのメリット・デメリット

### メリット

* ブラウザが使えるのでそっち側は環境を選ばない
* ブラウザはどれだけ繋いでも、常に同じ情報を確認できる
* サーバプログラムもいくらでも繋げられる
* 同時に複数試合ができる可能性
* Python / JavaScript / (CSS) / (HTML) なので、改変しやすい
* 履歴機能が使えるので、解説しやすい

### デメリット

* まともに動くか分からない
* 環境構築が面倒臭すぎる
    - セキュリティ上、「少なくともServerとManagerは同一ホスト、またはFWでガッチリ保護された場所」においておかないとマズそう。	


## TODO
* 再現機能
   - Serverが吐いたログからManager側で再現…が理想？
   - でも、Serverでログを読んで、再現したほうが実装的には簡単な気がする
* クライアント接続の改善
   - どっちも繋いで来ないと、名前が取れない問題
   - multiprocessingを使うとクライアント側が堕ちてしまった
* Map入力の改善
   - D&D対応どうすっかなー俺もなー…。
* マップ観測を途中から開始した場合、履歴機能がおかしい？
   - 出来る限り復元のつもりだったから…まぁこれで良いのかもという気も。