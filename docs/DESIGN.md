# 英単語 SRS 学習アプリ - 設計書

このドキュメントは、英単語 SRS 学習アプリの設計詳細を記述します。要件定義については [REQUIREMENTS.md](./REQUIREMENTS.md) を参照してください。

---

## 技術スタック

### フロントエンド
- **フレームワーク**: SvelteKit
  - 選定理由: シンプルで高速、静的サイト生成が容易
  - CLI: `sv` で作成

### データ管理
- **データソース**: 複数の JSON ファイル（フロントエンドで読み込み）
- **永続化**: localStorage のみ（バックエンド不要）
  - 進捗データ、学習ログ、セッション情報をすべて localStorage に保存

### 音声
- **音声合成**: Web Speech API（ブラウザ標準）
  - 無料、オフライン動作可能
  - `SpeechSynthesisUtterance` を使用

### 対応環境
- **ブラウザ**: Chrome（最新版）
- **デバイス**: スマートフォンでの使用を想定
- **UI言語**: すべて英語表記

---

## 単語データ（JSON）の詳細

### ファイル構成

複数の JSON ファイルに分割可能です。アプリ起動時に設定ファイルから読み込むファイルを指定します。

**設定ファイル例（`words-config.json`）：**
```json
{
  "wordFiles": [
    "/data/basic.json",
    "/data/advanced.json",
    "/data/business.json"
  ]
}
```

### 単語データのサンプル

各 JSON ファイルは以下の形式の配列を持ちます。

```json
[
  {
    "word": "unveil",
    "pronunciation": "/ʌnˈveɪl/",
    "katakana": "アンヴェイル",
    "type": "動詞",
    "meaning": "発表する・公開する・お披露目する",
    "contextMeaning": "（新しいサポートポートフォリオを）発表した",
    "example": "Wow, what an exciting week it's been at re:Invent, and a huge week for Support where we unveiled a completely revamped Support portfolio",
    "translation": "re:Inventで完全に刷新されたサポートポートフォリオを発表した、サポートにとって大きな週となった"
  }
]
```

---

## データモデル（概念設計）

### 単語（JSON から読み込み）

アプリが主に使うフィールド（イメージ）：

- `word`: 英単語（英語）。一意な識別子として使用。
- `meaning`: 日本語の意味。
- オプション（あると便利）:
  - `pronunciation`, `katakana`, `type`, `contextMeaning`
  - `example`, `translation`, `sentenceBreakdown`, `wordByWordTranslation`
  - `derivatives`（派生語リスト）

### 単語ごとの進捗（localStorage に保存）

各単語に対して、次のような情報を持ちます：

- `word`: 単語（識別子）。
- `repetition`: 連続して「覚えていた / 完璧」と答えた回数。
- `easeFactor`: 学習のしやすさを表す係数（初期値 2.5 前後を想定）。
- `interval`: 次回出題までの間隔（日単位）。
- `nextReviewAt`: 次回出題時刻（ミリ秒のタイムスタンプ）。
- `lastStudiedAt`: 最終学習時刻。
- `correctCount`: `Forgot` 以外の回答数。
- `wrongCount`: `Forgot` の回数。
- `totalStudyTimeSec`: その単語に費やした累計秒数。

### 学習ログ（レポート用）

1 回の学習ごとにログを残します：

- `word`: 単語
- `timestamp`: 学習時刻
- `rating`: `forgot` | `remembered` | `perfect`
- `timeSpentSec`: 単語表示から回答までの経過秒数。

### 学習セッション（時間計測用）

学習開始〜終了を 1 セッションとして管理します：

- `id`: セッション ID
- `startAt`: 開始時刻
- `endAt`: 終了時刻（学習中は `null`）
- `totalActiveSec`: 総学習時間（秒）
- `studyCount`: 学習した単語数

### 学習統計情報

学習の継続性を追跡するための統計情報：

- `currentStreak`: 現在の連続学習日数
- `longestStreak`: 最長の連続学習日数
- `totalStudies`: 総学習回数
- `lastStudyDate`: 最後に学習した日付

### localStorage のキー構成

バージョン付きキーで保存：

- `ela_v1_progress`: 単語ごとの進捗データ
- `ela_v1_study_logs`: 学習ログ
- `ela_v1_sessions`: 学習セッション
- `ela_v1_stats`: 学習統計情報

---

## SRS / 忘却曲線ロジック

### 採用アルゴリズム: FSRS (Free Spaced Repetition Scheduler)

このアプリでは **FSRS (Free Spaced Repetition Scheduler)** を採用します。

**FSRSの特徴:**
- **機械学習ベース**: 2万人のユーザーから7億件のレビューデータで学習された最新アルゴリズム（2023年開発）
- **高精度な記憶予測**: 個人の学習履歴を分析し、最適な復習タイミングを提案
- **効率性**: 従来のSM-2と比較して20-30%の復習回数削減を実現
- **3つの変数**: Retrievability (想起可能性), Stability (安定性), Difficulty (難易度) を使用
- **実績**: Anki、RemNoteなどの主要SRSアプリで採用

**実装:**
- JavaScript実装: [fsrs.js](https://github.com/open-spaced-repetition/fsrs.js)
- npm パッケージとして提供されているため、容易に統合可能

### 評価（Rating）

ユーザー操作と内部評価の対応：

- ボタン `Forgot` → rating: `forgot` (または FSRS の `Again`)
- ボタン `Remembered` → rating: `remembered` (または FSRS の `Hard`/`Good`)
- ボタン `Perfect` → rating: `perfect` (または FSRS の `Easy`)

### スケジューラのインターフェース

FSRSライブラリを使用しますが、将来的な差し替えを考慮して、
スケジューリングロジックは統一された関数インターフェースで抽象化します。

- `schedule(currentState, rating, now) -> nextState`
  - `currentState`: 既存の進捗（新規カードの場合は `null` でもよい）
  - `rating`: `forgot` | `remembered` | `perfect`
  - `now`: 現在時刻（タイムスタンプ）
  - `nextState`: 更新後の進捗（新しい `interval` / `nextReviewAt` を含む）

### FSRSの内部動作

FSRSは以下のパラメータを管理します：

- **Stability (S)**: 記憶の安定性（日数で表現）
- **Difficulty (D)**: 単語の難易度（0-10のスケール）
- **Retrievability (R)**: 現時点での想起可能性（0-1の確率）

これらのパラメータは学習履歴に基づいて自動的に最適化され、
`nextReviewAt` は想起可能性が最適な閾値（通常90%）に達するタイミングで算出されます。

### 出題順・優先順位（5単語1セット制）

**セット単位での出題**：

1. 出題する単語の選択は以下の優先順位で行います：
   - **学習対象カード**：`nextReviewAt <= now` のカード
   - **未出題カード**：`repetition === 0 && lastStudiedAt === null` のカード
   - **忘れている可能性が高いカード**：`interval` が長く、最終学習から時間が経っているカード（例：`interval >= 30` days かつ `lastStudiedAt` が古い順）

2. 上記優先順位から **5単語を選択** して1セットとする。

3. 各優先度内では、以下の要素を考慮してランダム性を持たせる：
   - 期限の超過時間（学習対象の場合）
   - `repetition` や `easeFactor` が低いカードを優先

4. **全単語学習済みの場合**：すべての単語が学習済みでも、忘れている確率が高い単語（`Remembered` を含む）を継続的に出題する。

**セット内での出題ルール**：

- セット内の全単語が `Remembered` または `Perfect` になるまで繰り返し出題する。
- セット内で一度 `Forgot` を選択した単語を再度出題する際は、選択肢を `Forgot` と `Remembered` の2つのみとする。

---

## 音声再生機能

### Web Speech API の利用

ブラウザ標準の **Web Speech API** を使用して、英単語の発音を音声で再生します。

**実装例：**
```javascript
const utterance = new SpeechSynthesisUtterance(word);
utterance.lang = 'en-US'; // または 'en-GB'
utterance.rate = 0.9; // 再生速度（0.1〜10）
window.speechSynthesis.speak(utterance);
```

**注意事項：**
- ブラウザ・OS 依存で音声品質にばらつきあり
- オフラインでも動作（ブラウザに音声エンジンが含まれている場合）
- iOS Safari ではユーザー操作（タップ）が必要

**UI 要素：**
- 単語の横にスピーカーアイコンを配置
- タップで発音を再生

---

## データのバックアップ/エクスポート

### エクスポート機能

学習履歴全体を JSON ファイルとしてダウンロードします。

**エクスポートデータの形式：**
```json
{
  "exportedAt": "2024-01-15T10:30:00Z",
  "progress": {
    "unveil": {
      "repetition": 3,
      "easeFactor": 2.6,
      "interval": 7,
      "nextReviewAt": 1705392000000,
      "lastStudiedAt": 1704787200000,
      "correctCount": 5,
      "wrongCount": 1,
      "totalStudyTimeSec": 45
    }
  },
  "studyLogs": [
    {
      "word": "unveil",
      "timestamp": 1704787200000,
      "rating": "perfect",
      "timeSpentSec": 8
    }
  ],
  "sessions": [
    {
      "id": "session-123",
      "startAt": 1704787200000,
      "endAt": 1704790800000,
      "totalActiveSec": 1800,
      "studyCount": 25
    }
  ],
  "stats": {
    "currentStreak": 5,
    "longestStreak": 10,
    "totalStudies": 500,
    "lastStudyDate": "2024-01-15"
  }
}
```

### インポート機能

エクスポートした JSON ファイルをアップロードして、学習履歴を復元します。

**動作：**
- ファイルアップロード時に形式の妥当性をチェック
- **既存データを完全に上書き**する（マージは行わない）
- インポート完了後、画面をリロード

---

## 画面構成の詳細

### Home 画面

**ボタン：**
- `Start Study`（学習開始）
- `View Report`（レポート表示）
- `Settings`（設定）

**今日のサマリ：**
- `Today's study count: X`（今日学習した単語数）
- `Mastered words: Y`（マスター済み単語数 - `Perfect` を選択した単語）
- `Study time today: Z min`（今日の学習時間）
- `Current streak: N days`（連続学習日数）

### Study 画面

**主な表示内容：**
- `Word`（英単語）、`Pronunciation`（発音記号）、`Type`（品詞）
- スピーカーアイコン（タップで音声再生）
- `Meaning`（日本語の意味）、`Context Meaning`（文脈での意味）
- `Example`（例文）、`Translation`（訳文）
- **意味の表示／非表示切り替え（必須機能）**：タップ・クリックで切り替え

**回答ボタン：**
- `Forgot`（赤 - 忘れた）
- `Remembered`（黄 - 覚えていた）
- `Perfect`（緑 - 完璧）
- ただし、セット内で `Forgot` を選んだ単語の再出題時は `Forgot` と `Remembered` の2つのみ表示

**進捗表示：**
- `Today's study count: X`（今日学習した単語数）
- `Total study count: Y`（累計学習単語数）
- `Current set: Z / 5`（現在のセット内での進捗）

**時間計測の実装：**
- カード表示時に `shownAt` を記録
- ボタンクリック時に `timeSpentSec = now - shownAt` を計算し、ログと進捗に反映

### Report 画面

**1. Overview（概要）：**
- `Total study days: X`（総学習日数）
- `Total studies: X`（総学習回数）
- `Mastered words: X`（マスター済み単語数 - `Perfect` を選択した単語）
- `Current streak: X days`（現在の連続学習日数）
- `Longest streak: X days`（最長連続学習日数）
- `Storage usage: X MB / Y MB`（localStorage 使用容量）

**2. Daily Studies（日別学習数）：**
- 期間フィルタ：`Today` / `This Week` / `This Month` / `All Time`
- 棒グラフまたはリストで表示
- 各日の学習単語数を表示

**3. Word Mastery（単語マスター度）：**
- 全単語のリスト表示
- マスター度の表示方法（例）：
  - `New`（未出題）
  - `Learning`（学習中 - `repetition` 1〜2）
  - `Stable`（安定 - `repetition` 3〜5）
  - `Mastered`（マスター済み - `Perfect` を選択済み）
  - または★1〜5 の評価
- ソート機能：`Sort by name`（名前順）、`Sort by mastery`（マスター度順）

**4. Weak Words（苦手単語）：**
- `wrongCount` が多い順、または `wrongCount / (correctCount + wrongCount)` の比率が高い順にソート
- 上位 10〜20 単語を表示
- 各単語の `Accuracy: X%`（正解率）、`Last studied: YYYY-MM-DD`（最終学習日）を表示

**5. Study Time（学習時間）：**
- 日別の総学習時間をグラフ表示
- 期間フィルタ対応：`Today` / `This Week` / `This Month` / `All Time`
- `Average study time: X min/day`（1日あたりの平均学習時間）を表示

### Settings 画面

**Data Management（データ管理）：**
- `Export Data`（データエクスポート）：学習履歴を JSON でダウンロード
- `Import Data`（データインポート）：JSON ファイルをアップロードして復元
- `Storage Usage`（ストレージ使用量）：使用中のストレージ容量を表示
- `Reset All Data`（全データ削除）：すべてのデータを削除（確認ダイアログ付き）

**Word Files（単語ファイル）：**
- 読み込む単語ファイルのリスト表示
- ファイルの追加・削除（再読み込みが必要）

**About（このアプリについて）：**
- `Version: X.X.X`（アプリのバージョン情報）
- `Help`（使い方のヘルプリンク）

---

## エラーハンドリング

### JSON 読み込みエラー

**チェック内容：**
- 必須フィールド（`word`, `meaning`）の欠損
- データ型の検証
- JSON パースエラー

**エラー表示例（英語）：**
```
Error: Failed to load word data

File: /data/basic.json
Issue: Missing 'meaning' field in word at line 5

Please fix the file and reload the page.
```

### localStorage 書き込みエラー

**発生する状況：**
- ストレージ容量の上限（通常 5〜10MB）
- プライベートモード（想定外）
- ブラウザの設定で無効化されている

**エラー表示例（英語）：**
```
Warning: Failed to save data

Cause: Storage quota exceeded

Solutions:
1. Export your data from Settings
2. Delete unnecessary data
3. Clear browser cache
```

---

## 開発用コマンド

### 依存関係のインストールと開発サーバー起動

```sh
npm install
npm run dev
```

ブラウザを自動で開きたい場合：

```sh
npm run dev -- --open
```

### 単語データのバリデーション

開発時に CLI ツールで単語データを検証できます：

```sh
npm run validate-words ./data/basic.json
```

**チェック内容：**
- 必須フィールド（`word`, `meaning`）の存在確認
- データ型の検証
- 重複単語のエラー表示（複数ファイル間での重複をチェック）

### ビルド

本番ビルドの作成：

```sh
npm run build
```

本番ビルドのプレビュー：

```sh
npm run preview
```

デプロイ時は、ターゲット環境に応じた [SvelteKit adapter](https://svelte.dev/docs/kit/adapters) を追加で設定します。
