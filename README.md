# ニンジャオーナー選挙サイト

CryptoNinja 新キャラクターのオーナー選挙サイト。静的サイト構成（ビルド不要）でVercelにそのままデプロイできます。

## デプロイ（Vercel）

### 方法A：CLI

```bash
npm i -g vercel
cd ninja-owner-election
vercel          # プレビュー
vercel --prod   # 本番
```

### 方法B：GitHub連携

1. このフォルダをGitHubリポジトリにpush
2. Vercelダッシュボード → Add New → Project → リポジトリを選択
3. Framework Preset: **Other**（設定不要、そのままDeploy）

`cleanUrls: true` を設定済みなので `/vote` `/candidates` のようにアクセスできます（`/vote.html` も動きます）。

## ファイル構成

```
index.html          トップページ
candidates.html     候補者一覧ページ
vote.html           投票ページ（ホルダー投票くんへのリンク）
css/style.css       共有スタイル
js/config.js        ★サイト設定（フェーズ切替・各種URL）
js/candidates-data.js ★候補者データ
js/bg.js            背景Canvas（サイバー空間＋水流＋墨煙）
js/main.js          共通処理
assets/             画像置き場（NFT画像・候補者アイコン・背景画像）
```

## 運用手順（★のファイルだけ触ればOK）

### 1. 候補者を追加する

`js/candidates-data.js` の配列に上から順に追加します。**配列の順番＝表示順**なので、にんセレ会場で声明を上げた人を上に並べます。

```js
{
  name: "候補者名",
  badge: "ninsele",   // 会場参加は "ninsele"、Discordからは "discord"
  icon: "assets/icons/xxx.png",  // アイコン画像（空文字なら仮表示）
  statement: "候補文をここに。",
},
```

### 2. 投票開始したら

`js/config.js` を1行変更：

```js
phase: "voting",
```

これだけでトップページの並びが自動で変わり、**候補者の声明＋投票ボタンがヒーロー直下に移動**し、「投票受付中」表示になります。投票が終わったら `"pre"` に戻すか、そのままでもOK。

### 3. 各種URLの差し替え

`js/config.js` で一括管理：

- `voteUrl` : 本番の投票URL（`https://tohyo.mad-member-tools.com/vote/XXXX`）
- `cngtFormUrl` : CNGT申請フォーム
- `ninseleUrl` : にんセレ詳細ページ

### 4. 画像の差し替え

- **NFT画像**：`index.html` 内の2箇所のコメント（`nft.png`）を検索して `<img>` に差し替え
- **背景画像**（ChatGPT生成）：`css/style.css` の `.bg-image-slot` の `background-image` コメントを外す。Canvas演出と重ねて表示されます（`opacity` で濃さ調整）
- **候補者アイコン**：`assets/` に置いて candidates-data.js の `icon` にパスを指定

### 5. 日程の確定

`index.html` の「選挙暦」セクション内の `◯月◯日` を検索して置換。
