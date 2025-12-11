# 英単語 SRS 学習アプリ

忘却曲線と SRS（Spaced Repetition System）に基づいて英単語を学習するWebアプリケーションです。

## 特徴

- **SRS（間隔反復）学習**: FSRSアルゴリズムで最適なタイミングで復習
- **5単語1セット制**: 効率的な学習フロー
- **完全オフライン**: バックエンド不要、ブラウザのlocalStorageのみで動作
- **音声再生**: Web Speech APIによる発音確認
- **学習分析**: 詳細なレポートとストリーク機能

## 技術スタック

- **フロントエンド**: SvelteKit
- **ストレージ**: localStorage
- **音声**: Web Speech API
- **対象環境**: Chrome（最新版）、スマートフォン対応

## ドキュメント

プロジェクトの詳細なドキュメントは以下を参照してください：

- **[要件定義書](docs/REQUIREMENTS.md)** - アプリの機能要件、画面構成、非機能要件
- **[設計書](docs/DESIGN.md)** - 技術スタック、データモデル、アルゴリズム、実装詳細
- **[開発ロードマップ](docs/ROADMAP.md)** - 開発優先順位、フェーズ計画

## 開発

### セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### ビルド

```bash
# 本番ビルド
npm run build

# ビルドのプレビュー
npm run preview
```

### 単語データのバリデーション

```bash
npm run validate-words ./data/basic.json
```

## プロジェクト構成

```
english_learn_app/
├── docs/                  # ドキュメント
│   ├── REQUIREMENTS.md   # 要件定義書
│   └── DESIGN.md         # 設計書
├── src/                  # ソースコード
├── data/                 # 単語データ（JSON）
└── README.md            # このファイル
```

## ライセンス

（ライセンス情報を記載）
