# JavaScript_Scaffolding

子ども向けの JavaScript 学習支援アプリです。  
CodeMirror を使ったエディタで JavaScript を書いて実行でき、目標出力との比較で正誤判定がされます。  
OpenAI API を使って、実行結果に応じたヒントやフィードバックも自動生成されます。


## セットアップ方法（VS Code + Live Server）

このアプリはローカルHTML/JSアプリです。  
以下の手順で Visual Studio Code + Live Server を使って簡単に実行できます。

---

### 1. リポジトリをクローンして VS Code で開く

```bash
git clone https://github.com/Okunoryuto0430/JavaScript_Scaffolding.git
cd JavaScript_Scaffolding
code .
````

> `code .` は VS Code をターミナルから開くコマンドです。動かない場合は手動で VS Code を起動し、プロジェクトフォルダを開いてください。

---

### 2. Live Server 拡張機能をインストール

1. 左側の拡張機能アイコン（四角いブロック）をクリック
2. 検索バーに `Live Server` と入力
3. 「Live Server（Ritwick Dey）」をインストール

---

### 3. Live Server を起動する

* `index.html` を開いた状態で、画面右下の **「Go Live」** をクリック
  または
* エディタ上で右クリック → **「Open with Live Server」**

自動的にブラウザが開き、以下のような URL にアクセスされます：

```
http://127.0.0.1:5500/
```

---

### 4. OpenAI API キーを設定

`script.js` の以下の行を、自分の OpenAI API キーに書き換えてください：

```js
const apiKey = "YOUR_OPENAI_API_KEY_HERE";
```

> ⚠️ **セキュリティ上の注意**：API キーは絶対に GitHub へ push しないようにしてください。

---

### これでセットアップ完了！

ブラウザ上で課題の表示・コードエディタ・実行結果・正誤判定・ヒント生成まで動作確認できます！
