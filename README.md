# ATELIER COURT / Shadow Garden

Blenderのファイルを流用せず、Three.jsでゼロから組んだ都市型住宅のインタラクティブな3Dスタディです。

明るい石の基壇、浮遊する木のプライベート階、水盤のあるスカイコート、銅色のフレームを組み合わせた、前作とは別方向のデザインにしています。建物だけの模型ではなく、家具・階段・ガラス・植栽・照明・敷地まで同じシーン内で生成します。

## できること

- Three.js / OrbitControlsによる回転・ズーム
- 全体外観、1F、LDKのカメラプリセット
- LDK表示時の半透明カットアウェイ
- 昼景・夜景の切り替え
- 自動回転のオン・オフ
- 201.2㎡、2台ガレージ、1つの中庭という設計データをUIに表示
- 石、木、ガラス、金属、水、植栽、家具をプロシージャルな立体部品として生成

## 起動

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000/` を開いてください。

検証コマンド:

```bash
npm run build
npm run lint
```

## 主なファイル

- `app/page.tsx`: Three.jsシーン、建築部品、インタラクション
- `app/globals.css`: 建築プレゼンテーション用のUIとレスポンシブレイアウト
- `app/layout.tsx`: ページメタデータ

## 方針

このrepoは、既存のRawai repoおよびBlender用の別repoとは独立しています。Three.jsのシーンは外部のBlenderファイルや画像素材に依存しません。
