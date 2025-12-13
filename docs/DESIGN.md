# 英単語 SRS 学習アプリ - 設計書

このドキュメントは、英単語 SRS 学習アプリの設計詳細を記述します。要件定義については [REQUIREMENTS.md](./REQUIREMENTS.md) を参照してください。

---

## 技術スタック

### フロントエンド
- **フレームワーク**: SvelteKit
  - 選定理由: シンプルで高速、静的サイト生成が容易
  - CLI: `sv` で作成

### 言語
- **JavaScript**: ESModule形式
- **型定義**: JSDoc による型アノテーション
  - TypeScriptファイル（`.ts`）は使用しない
  - JSDocコメントでランタイム型チェックとエディタ補完を提供

### データ管理
- **データソース**: 複数の JSON ファイル（フロントエンドで読み込み）
- **永続化**: localStorage のみ（バックエンド不要）

### 音声
- **音声合成**: Web Speech API（ブラウザ標準）
  - 実装: `SpeechSynthesisUtterance` を使用
  - 無料、オフライン動作可能

### 対応環境
- **ブラウザ**: Chrome（最新版）
- **デバイス**: スマートフォン
- **UI言語**: すべて英語表記

---

## アーキテクチャ

### ディレクトリ構造

```
src/
├── routes/               # SvelteKitルート
│   ├── +page.svelte     # Home画面
│   ├── +layout.svelte   # 共通レイアウト
│   ├── study/
│   │   └── +page.svelte # Study画面
│   ├── report/
│   │   └── +page.svelte # Report画面
│   └── settings/
│       └── +page.svelte # Settings画面
├── lib/
│   ├── components/      # 再利用可能コンポーネント
│   │   ├── WordCard.svelte
│   │   ├── RatingButtons.svelte
│   │   ├── SessionControl.svelte
│   │   ├── ProgressIndicator.svelte
│   │   └── ...
│   ├── stores/          # Svelteストア（状態管理）
│   │   ├── words.js
│   │   ├── progress.js
│   │   ├── session.js
│   │   └── stats.js
│   ├── services/        # ビジネスロジック
│   │   ├── scheduler.js # FSRS統合
│   │   ├── studyQueue.js # 出題管理
│   │   └── speech.js    # 音声再生
│   ├── storage/         # localStorage操作
│   │   ├── index.js     # 統合API
│   │   ├── progress.js
│   │   ├── logs.js
│   │   └── sessions.js
│   └── utils/           # ユーティリティ
│       ├── validator.js
│       ├── time.js
│       └── date.js
├── data/                # 単語データ（JSON）
│   └── basic.json
└── static/              # 静的アセット
```

**注意:**
- `src/lib/types/` ディレクトリは作成しない
- 型定義は各ファイルで JSDoc として記述

### レイヤー構成

```
┌─────────────────────────────────────┐
│     UI Layer (Svelte Components)    │
├─────────────────────────────────────┤
│   State Layer (Svelte Stores)       │
├─────────────────────────────────────┤
│   Service Layer (Business Logic)    │
├─────────────────────────────────────┤
│   Storage Layer (localStorage API)  │
└─────────────────────────────────────┘
```

---

## JSDoc 型定義

### 共通型定義の配置

型定義は各ファイルの先頭で `@typedef` を使用して定義します。
共通で使用する型は以下のファイルに記載します：

- `src/lib/stores/words.js` - WordData, WordsConfig
- `src/lib/stores/progress.js` - WordProgress, ProgressMap, FSRSState
- `src/lib/stores/session.js` - StudySession
- `src/lib/stores/stats.js` - StudyStats
- `src/lib/services/studyQueue.js` - StudySet, CurrentStudy

### 単語データ型定義

**src/lib/stores/words.js:**

```javascript
/**
 * JSON から読み込む単語データ
 * @typedef {Object} WordData
 * @property {string} word - 必須: 英単語（一意な識別子）
 * @property {string} meaning - 必須: 日本語の意味
 * @property {string} [pronunciation] - 発音記号
 * @property {string} [katakana] - カタカナ読み
 * @property {string} [type] - 品詞
 * @property {string} [contextMeaning] - 文脈での意味
 * @property {string} [example] - 例文
 * @property {string} [translation] - 例文の訳
 * @property {string} [sentenceBreakdown] - 文の構造解析
 * @property {string} [wordByWordTranslation] - 単語ごとの訳
 * @property {string[]} [derivatives] - 派生語リスト
 */

/**
 * 単語設定ファイル
 * @typedef {Object} WordsConfig
 * @property {string[]} wordFiles - 読み込む単語ファイルのパス
 */

/**
 * 単語ストアの状態
 * @typedef {Object} WordsState
 * @property {WordData[]} words - 単語データの配列
 * @property {boolean} loading - 読み込み中かどうか
 * @property {string | null} error - エラーメッセージ
 */
```

### 学習進捗型定義

**src/lib/stores/progress.js:**

```javascript
/**
 * FSRS の状態
 * @typedef {'New' | 'Learning' | 'Review' | 'Relearning'} FSRSState
 */

/**
 * 単語ごとの進捗情報
 * @typedef {Object} WordProgress
 * @property {string} word - 単語（識別子）
 * @property {FSRSState} state - FSRS の状態
 * @property {number} stability - 記憶の安定性（日数）
 * @property {number} difficulty - 難易度（0-10）
 * @property {number} retrievability - 想起可能性（0-1）
 * @property {number} elapsedDays - 最後の復習からの経過日数
 * @property {number} scheduledDays - 次回復習までの予定日数
 * @property {number} reps - 復習回数
 * @property {number} lapses - 忘れた回数
 * @property {number} lastReview - 最終学習時刻（タイムスタンプ）
 * @property {number} due - 次回出題時刻（タイムスタンプ）
 * @property {Rating} lastRating - 最後の評価（優先度スコア計算用）
 * @property {number} correctCount - Forgot 以外の回答数
 * @property {number} wrongCount - Forgot の回数
 * @property {number} totalStudyTimeSec - 累計学習時間（秒）
 * @property {boolean} isMastered - Perfect を選択してマスター済みかどうか
 */

/**
 * 進捗データのマップ（word をキーとする）
 * @typedef {Record<string, WordProgress>} ProgressMap
 */
```

### 学習ログとセッション型定義

**src/lib/storage/logs.js:**

```javascript
/**
 * ユーザーの評価
 * @typedef {'forgot' | 'remembered' | 'perfect'} Rating
 */

/**
 * 学習ログ
 * @typedef {Object} StudyLog
 * @property {string} word - 単語
 * @property {number} timestamp - 学習時刻
 * @property {Rating} rating - 評価
 * @property {number} timeSpentSec - 回答時間（秒）
 * @property {FSRSState} state - 学習時の状態
 */
```

**src/lib/stores/session.js:**

```javascript
/**
 * 学習セッション
 * @typedef {Object} StudySession
 * @property {string} id - セッション ID
 * @property {number} startAt - 開始時刻
 * @property {number | null} endAt - 終了時刻（学習中は null）
 * @property {number} totalActiveSec - 総学習時間（秒）
 * @property {number} studyCount - 学習した単語数
 */

/**
 * セッションストアの状態
 * @typedef {Object} SessionState
 * @property {StudySession | null} current - 現在のセッション
 * @property {boolean} isActive - アクティブかどうか
 */
```

### 統計情報型定義

**src/lib/stores/stats.js:**

```javascript
/**
 * 学習統計情報
 * @typedef {Object} StudyStats
 * @property {number} currentStreak - 現在の連続学習日数
 * @property {number} longestStreak - 最長の連続学習日数
 * @property {number} totalStudies - 総学習回数
 * @property {string} lastStudyDate - 最後に学習した日付（YYYY-MM-DD）
 */
```

### 学習フロー型定義

**src/lib/services/studyQueue.js:**

```javascript
/**
 * 学習セット（5単語1セット）
 * @typedef {Object} StudySet
 * @property {string[]} words - セット内の単語リスト
 * @property {Set<string>} completedWords - 完了した単語（Remembered または Perfect）
 * @property {Set<string>} forgotWords - Forgot を選択した単語
 */

/**
 * 現在学習中の単語情報
 * @typedef {Object} CurrentStudy
 * @property {string} word - 単語
 * @property {WordData} wordData - 単語データ
 * @property {WordProgress} progress - 進捗情報
 * @property {number} shownAt - 表示開始時刻
 * @property {boolean} meaningVisible - 意味の表示/非表示
 */
```

### エクスポート/インポート型定義

**src/lib/storage/index.js:**

```javascript
/**
 * エクスポートデータ形式
 * @typedef {Object} ExportData
 * @property {string} exportedAt - エクスポート日時（ISO 8601）
 * @property {ProgressMap} progress - 進捗データ
 * @property {StudyLog[]} studyLogs - 学習ログ
 * @property {StudySession[]} sessions - セッション情報
 * @property {StudyStats} stats - 統計情報
 */
```

---

## ルーティング設計

### SvelteKit ルート構成

| パス | ページ | 説明 |
|------|--------|------|
| `/` | Home | ホーム画面（学習開始、レポート、設定へのリンク） |
| `/study` | Study | 学習画面（単語学習） |
| `/report` | Report | レポート画面（学習統計） |
| `/settings` | Settings | 設定画面（データ管理、単語ファイル設定） |

### ページ遷移フロー

```
┌──────┐
│ Home │
└──┬───┘
   ├─→ /study    (Start Study)
   ├─→ /report   (View Report)
   └─→ /settings (Settings)
```

**ナビゲーション:**
- 各ページに戻るボタン（← Back to Home）を配置
- セッション中は `/study` からの離脱時に確認ダイアログ表示

---

## 状態管理設計（Svelte Stores）

### 1. wordsStore (`src/lib/stores/words.js`)

**責務:** 単語データの管理

```javascript
import { writable, derived } from 'svelte/store';

// 型定義は同じファイル内で定義済み（上記の WordData, WordsConfig, WordsState を参照）

/** @type {import('svelte/store').Writable<WordsState>} */
export const wordsStore = writable({
  words: [],
  loading: false,
  error: null
});

// 単語をマップ形式で取得（word をキーとする）
export const wordsMap = derived(
  wordsStore,
  ($words) => new Map($words.words.map(w => [w.word, w]))
);

/**
 * 単語データを読み込む
 * @param {WordsConfig} config - 単語ファイルの設定
 * @returns {Promise<void>}
 */
export async function loadWords(config) {
  // 実装
}

/**
 * 単語データのバリデーション
 * @returns {boolean}
 */
export function validateWords() {
  // 実装
}
```

### 2. progressStore (`src/lib/stores/progress.js`)

**責務:** 学習進捗の管理

```javascript
import { writable } from 'svelte/store';

// 型定義は同じファイル内で定義済み（上記の ProgressMap, WordProgress を参照）

/** @type {import('svelte/store').Writable<ProgressMap>} */
export const progressStore = writable({});

/**
 * localStorage から進捗データを読み込む
 * @returns {void}
 */
export function load() {
  // 実装
}

/**
 * localStorage に進捗データを保存
 * @returns {void}
 */
export function save() {
  // 実装
}

/**
 * 単語の進捗を更新
 * @param {string} word - 単語
 * @param {WordProgress} progress - 進捗情報
 * @returns {void}
 */
export function update(word, progress) {
  // 実装
}

/**
 * 単語の進捗を取得
 * @param {string} word - 単語
 * @returns {WordProgress | null}
 */
export function get(word) {
  // 実装
}
```

### 3. sessionStore (`src/lib/stores/session.js`)

**責務:** 学習セッションの管理

```javascript
import { writable, derived } from 'svelte/store';

// 型定義は同じファイル内で定義済み（上記の StudySession, SessionState を参照）

/** @type {import('svelte/store').Writable<SessionState>} */
export const sessionStore = writable({
  current: null,
  isActive: false
});

// アクティブな学習時間を計算
export const activeTime = derived(
  sessionStore,
  ($session) => {
    if (!$session.isActive || !$session.current) return 0;
    return Math.floor((Date.now() - $session.current.startAt) / 1000);
  }
);

/**
 * セッション開始
 * @returns {void}
 */
export function startSession() {
  // 実装
}

/**
 * セッション終了
 * @returns {void}
 */
export function endSession() {
  // 実装
}

/**
 * セッション情報更新
 * @param {number} studyCount - 学習した単語数
 * @returns {void}
 */
export function updateSession(studyCount) {
  // 実装
}
```

### 4. statsStore (`src/lib/stores/stats.js`)

**責務:** 学習統計の管理

```javascript
import { writable } from 'svelte/store';

// 型定義は同じファイル内で定義済み（上記の StudyStats を参照）

/** @type {import('svelte/store').Writable<StudyStats>} */
export const statsStore = writable({
  currentStreak: 0,
  longestStreak: 0,
  totalStudies: 0,
  lastStudyDate: ''
});

/**
 * ストリーク更新
 * @param {string} date - 日付（YYYY-MM-DD）
 * @returns {void}
 */
export function updateStreak(date) {
  // 実装
}

/**
 * 総学習回数をインクリメント
 * @returns {void}
 */
export function incrementTotalStudies() {
  // 実装
}
```

---

## localStorage 層 API 設計

### 基本設計

**キー構成 (`src/lib/storage/index.js`):**

```javascript
export const STORAGE_KEYS = {
  PROGRESS: 'ela_v1_progress',
  LOGS: 'ela_v1_study_logs',
  SESSIONS: 'ela_v1_sessions',
  STATS: 'ela_v1_stats'
};
```

### API インターフェース

#### Progress API (`src/lib/storage/progress.js`)

```javascript
import { STORAGE_KEYS } from './index.js';

/**
 * @typedef {import('../stores/progress.js').ProgressMap} ProgressMap
 * @typedef {import('../stores/progress.js').WordProgress} WordProgress
 */

export const progressStorage = {
  /**
   * 進捗データを読み込む
   * @returns {ProgressMap}
   */
  load() {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return data ? JSON.parse(data) : {};
  },

  /**
   * 進捗データを保存
   * @param {ProgressMap} progress - 進捗データ
   * @returns {void}
   * @throws {StorageQuotaExceededError}
   */
  save(progress) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
    } catch (error) {
      throw new StorageQuotaExceededError('Failed to save progress');
    }
  },

  /**
   * 単語の進捗を取得
   * @param {string} word - 単語
   * @returns {WordProgress | null}
   */
  get(word) {
    const progress = this.load();
    return progress[word] || null;
  },

  /**
   * 単語の進捗を更新
   * @param {string} word - 単語
   * @param {WordProgress} progress - 進捗情報
   * @returns {void}
   */
  update(word, progress) {
    const allProgress = this.load();
    allProgress[word] = progress;
    this.save(allProgress);
  },

  /**
   * 全データを削除
   * @returns {void}
   */
  clear() {
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
  }
};
```

#### Logs API (`src/lib/storage/logs.js`)

```javascript
import { STORAGE_KEYS } from './index.js';

// 型定義は同じファイル内で定義済み（上記の Rating, StudyLog を参照）

export const logsStorage = {
  /**
   * 学習ログを読み込む
   * @returns {StudyLog[]}
   */
  load() {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },

  /**
   * 学習ログを追加
   * @param {StudyLog} log - 学習ログ
   * @returns {void}
   */
  add(log) {
    const logs = this.load();
    logs.push(log);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },

  /**
   * 期間でフィルタリング
   * @param {Date} startDate - 開始日
   * @param {Date} endDate - 終了日
   * @returns {StudyLog[]}
   */
  filterByDate(startDate, endDate) {
    const logs = this.load();
    return logs.filter(log =>
      log.timestamp >= startDate.getTime() &&
      log.timestamp <= endDate.getTime()
    );
  },

  /**
   * 単語ごとのログを取得
   * @param {string} word - 単語
   * @returns {StudyLog[]}
   */
  getByWord(word) {
    const logs = this.load();
    return logs.filter(log => log.word === word);
  },

  /**
   * 全データを削除
   * @returns {void}
   */
  clear() {
    localStorage.removeItem(STORAGE_KEYS.LOGS);
  }
};
```

#### Sessions API (`src/lib/storage/sessions.js`)

```javascript
/**
 * @typedef {import('../stores/session.js').StudySession} StudySession
 */

export const sessionsStorage = {
  /**
   * セッションデータを読み込む
   * @returns {StudySession[]}
   */
  load() { /* ... */ },

  /**
   * セッションを追加
   * @param {StudySession} session - セッション情報
   * @returns {void}
   */
  add(session) { /* ... */ },

  /**
   * セッションを更新
   * @param {string} sessionId - セッション ID
   * @param {Partial<StudySession>} updates - 更新内容
   * @returns {void}
   */
  update(sessionId, updates) { /* ... */ },

  /**
   * 全データを削除
   * @returns {void}
   */
  clear() { /* ... */ }
};
```

#### Stats API (`src/lib/storage/stats.js`)

```javascript
/**
 * @typedef {import('../stores/stats.js').StudyStats} StudyStats
 */

export const statsStorage = {
  /**
   * 統計データを読み込む
   * @returns {StudyStats}
   */
  load() { /* ... */ },

  /**
   * 統計データを保存
   * @param {StudyStats} stats - 統計情報
   * @returns {void}
   */
  save(stats) { /* ... */ },

  /**
   * 全データを削除
   * @returns {void}
   */
  clear() { /* ... */ }
};
```

### エラーハンドリング

```javascript
/**
 * ストレージ容量超過エラー
 */
export class StorageQuotaExceededError extends Error {
  /**
   * @param {string} message - エラーメッセージ
   */
  constructor(message) {
    super(message);
    this.name = 'StorageQuotaExceededError';
  }
}

/**
 * データ破損エラー
 */
export class DataCorruptionError extends Error {
  /**
   * @param {string} message - エラーメッセージ
   */
  constructor(message) {
    super(message);
    this.name = 'DataCorruptionError';
  }
}
```

---

## FSRS 統合の詳細

### インストール

```bash
npm install fsrs
```

### Scheduler サービス (`src/lib/services/scheduler.js`)

```javascript
import { FSRS, Rating, State } from 'fsrs';

/**
 * @typedef {import('../stores/progress.js').WordProgress} WordProgress
 * @typedef {import('../stores/progress.js').FSRSState} FSRSState
 * @typedef {import('../storage/logs.js').Rating} Rating
 */

/**
 * FSRS スケジューラのラッパー
 */
export class StudyScheduler {
  constructor() {
    // FSRS を初期化（デフォルトパラメータ）
    this.fsrs = new FSRS();
  }

  /**
   * アプリの Rating を FSRS の Rating に変換
   * @param {Rating} rating - アプリの評価
   * @returns {import('fsrs').Rating} FSRS の Rating
   * @private
   */
  mapRating(rating) {
    switch (rating) {
      case 'forgot':
        return Rating.Again;
      case 'remembered':
        return Rating.Good;
      case 'perfect':
        return Rating.Easy;
    }
  }

  /**
   * FSRS の State をアプリの FSRSState に変換
   * @param {import('fsrs').State} state - FSRS の State
   * @returns {FSRSState}
   * @private
   */
  mapState(state) {
    switch (state) {
      case State.New:
        return 'New';
      case State.Learning:
        return 'Learning';
      case State.Review:
        return 'Review';
      case State.Relearning:
        return 'Relearning';
    }
  }

  /**
   * アプリの FSRSState を FSRS の State に変換
   * @param {FSRSState} state - アプリの FSRSState
   * @returns {import('fsrs').State}
   * @private
   */
  mapStateToFSRS(state) {
    switch (state) {
      case 'New': return State.New;
      case 'Learning': return State.Learning;
      case 'Review': return State.Review;
      case 'Relearning': return State.Relearning;
    }
  }

  /**
   * 単語を学習してスケジュールを更新
   * @param {string} word - 単語
   * @param {WordProgress | null} currentProgress - 現在の進捗（新規の場合は null）
   * @param {Rating} rating - 評価
   * @param {Date} [now] - 現在時刻（デフォルト: new Date()）
   * @returns {WordProgress} 更新後の進捗
   */
  schedule(word, currentProgress, rating, now = new Date()) {
    const fsrsRating = this.mapRating(rating);

    // 新規カードの場合
    if (!currentProgress) {
      const card = this.fsrs.newCard();
      const schedulingCards = this.fsrs.repeat(card, now);
      const nextCard = schedulingCards[fsrsRating].card;

      return {
        word,
        state: this.mapState(nextCard.state),
        stability: nextCard.stability,
        difficulty: nextCard.difficulty,
        retrievability: 0,
        elapsedDays: nextCard.elapsed_days,
        scheduledDays: nextCard.scheduled_days,
        reps: nextCard.reps,
        lapses: nextCard.lapses,
        lastReview: nextCard.last_review?.getTime() || now.getTime(),
        due: nextCard.due.getTime(),
        lastRating: rating,
        correctCount: rating !== 'forgot' ? 1 : 0,
        wrongCount: rating === 'forgot' ? 1 : 0,
        totalStudyTimeSec: 0,
        isMastered: rating === 'perfect'
      };
    }

    // 既存カードの更新
    const card = {
      due: new Date(currentProgress.due),
      stability: currentProgress.stability,
      difficulty: currentProgress.difficulty,
      elapsed_days: currentProgress.elapsedDays,
      scheduled_days: currentProgress.scheduledDays,
      reps: currentProgress.reps,
      lapses: currentProgress.lapses,
      state: this.mapStateToFSRS(currentProgress.state),
      last_review: new Date(currentProgress.lastReview)
    };

    const schedulingCards = this.fsrs.repeat(card, now);
    const nextCard = schedulingCards[fsrsRating].card;

    return {
      ...currentProgress,
      state: this.mapState(nextCard.state),
      stability: nextCard.stability,
      difficulty: nextCard.difficulty,
      elapsedDays: nextCard.elapsed_days,
      scheduledDays: nextCard.scheduled_days,
      reps: nextCard.reps,
      lapses: nextCard.lapses,
      lastReview: nextCard.last_review?.getTime() || now.getTime(),
      due: nextCard.due.getTime(),
      lastRating: rating,
      correctCount: currentProgress.correctCount + (rating !== 'forgot' ? 1 : 0),
      wrongCount: currentProgress.wrongCount + (rating === 'forgot' ? 1 : 0),
      isMastered: currentProgress.isMastered || rating === 'perfect'
    };
  }
}

// シングルトンインスタンス
export const scheduler = new StudyScheduler();
```

---

## 学習フロー（Study Queue）設計

### 出題優先度スコア

単語の出題順序を決定するため、統一した数値基準として **優先度スコア（priorityScore）** を使用します。
スコアが高い単語ほど優先的に出題されます。

#### スコア計算式

```
priorityScore = baseScore × lastRatingFactor × overdueRatio
```

**各要素の定義:**

| 要素 | 説明 | 計算方法 |
|------|------|----------|
| `baseScore` | 基本スコア | 未学習: 100, 学習済み: 50 |
| `lastRatingFactor` | 最終評価係数 | forgot: 1.5, remembered: 1.2, perfect: 1.0 |
| `overdueRatio` | 期限超過率 | `max(1, elapsedDays / scheduledDays)` |

**計算例:**

| 状態 | baseScore | lastRatingFactor | overdueRatio | priorityScore |
|------|-----------|------------------|--------------|---------------|
| 未学習 | 100 | 1.0 | 1.0 | 100 |
| 前回forgot、3日経過/予定1日 | 50 | 1.5 | 3.0 | 225 |
| 前回remembered、7日経過/予定7日 | 50 | 1.2 | 1.0 | 60 |
| 前回perfect、30日経過/予定30日 | 50 | 1.0 | 1.0 | 50 |

#### 実装

```javascript
/**
 * 単語の出題優先度スコアを計算
 * @param {WordProgress | null} progress - 単語の進捗情報（未学習の場合は null）
 * @returns {number} 優先度スコア（高いほど優先）
 */
function calculatePriorityScore(progress) {
  // 未学習の単語
  if (!progress) {
    return 100;
  }

  // 基本スコア
  const baseScore = 50;

  // 最終評価係数
  const lastRatingFactor = {
    forgot: 1.5,
    remembered: 1.2,
    perfect: 1.0
  }[progress.lastRating] || 1.0;

  // 期限超過率（最小1.0）
  const elapsedDays = (Date.now() - progress.lastReview) / (1000 * 60 * 60 * 24);
  const overdueRatio = Math.max(1, elapsedDays / Math.max(1, progress.scheduledDays));

  return baseScore * lastRatingFactor * overdueRatio;
}
```

### 出題管理 (`src/lib/services/studyQueue.js`)

```javascript
/**
 * @typedef {import('../stores/words.js').WordData} WordData
 * @typedef {import('../stores/progress.js').WordProgress} WordProgress
 * @typedef {import('../stores/progress.js').ProgressMap} ProgressMap
 */

// 型定義は同じファイル内で定義済み（上記の StudySet を参照）

export class StudyQueue {
  /**
   * 5単語を選択して学習セットを作成
   * priorityScore が高い順に選択
   * @param {WordData[]} words - 全単語データ
   * @param {ProgressMap} progressMap - 進捗データ
   * @returns {string[]} 選択された5単語
   */
  selectWords(words, progressMap) {
    const wordList = words.map(w => w.word);

    // 全単語の優先度スコアを計算してソート
    const scoredWords = wordList.map(word => ({
      word,
      score: calculatePriorityScore(progressMap[word] || null)
    }));

    // スコアが高い順にソート
    scoredWords.sort((a, b) => b.score - a.score);

    // 上位5単語を選択
    return scoredWords.slice(0, 5).map(item => item.word);
  }

  /**
   * セット内の次の単語を取得
   * @param {StudySet} set - 学習セット
   * @returns {string | null} 次の単語（完了時は null）
   */
  getNextWord(set) {
    const remaining = set.words.filter(
      word => !set.completedWords.has(word)
    );

    if (remaining.length === 0) return null;

    // Forgot を選択した単語を優先的に出題
    const forgotRemaining = remaining.filter(w => set.forgotWords.has(w));
    if (forgotRemaining.length > 0) {
      return forgotRemaining[0];
    }

    return remaining[0];
  }

  /**
   * セットが完了したか判定
   * @param {StudySet} set - 学習セット
   * @returns {boolean}
   */
  isSetComplete(set) {
    return set.completedWords.size === set.words.length;
  }
}

// シングルトンインスタンス
export const studyQueue = new StudyQueue();
```

---

## コンポーネント設計

### 主要コンポーネント

#### 1. WordCard (`src/lib/components/WordCard.svelte`)

**責務:** 単語カードの表示

**Props:**
```javascript
/** @type {WordData} */
export let wordData;

/** @type {boolean} */
export let meaningVisible = false;

/** @type {(word: string) => void} */
export let onSpeakWord;
```

**表示内容:**
- 英単語、発音記号、品詞
- 意味（表示/非表示切り替え可能）
- 例文と訳
- スピーカーアイコン

#### 2. RatingButtons (`src/lib/components/RatingButtons.svelte`)

**責務:** 評価ボタンの表示

**Props:**
```javascript
/** @type {(rating: Rating) => void} */
export let onRate;

/** @type {boolean} - Forgot後は Perfect を非表示 */
export let hidePerfect = false;
```

**表示:**
- `Forgot` ボタン（赤）
- `Perfect` ボタン（オレンジ、条件により非表示）
- `Remembered` ボタン（青）

#### 3. SessionControl (`src/lib/components/SessionControl.svelte`)

**責務:** セッション制御のフローティングボタン

**Props:**
```javascript
/** @type {boolean} */
export let isActive;

/** @type {() => void} */
export let onStart;

/** @type {() => void} */
export let onStop;
```

#### 4. ProgressIndicator (`src/lib/components/ProgressIndicator.svelte`)

**責務:** 学習進捗の表示

**Props:**
```javascript
/** @type {number} */
export let todayCount;

/** @type {number} */
export let totalCount;

/** @type {{ current: number; total: number }} */
export let setProgress;
```

---

## バリデーション設計

### 単語データのバリデーション (`src/lib/utils/validator.js`)

```javascript
/**
 * @typedef {import('../stores/words.js').WordData} WordData
 */

/**
 * バリデーションエラー
 * @typedef {Object} ValidationError
 * @property {number} index - エラーが発生した単語のインデックス
 * @property {string} field - エラーが発生したフィールド名
 * @property {string} message - エラーメッセージ
 */

/**
 * バリデーション結果
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - バリデーションが成功したか
 * @property {ValidationError[]} errors - エラーの配列
 */

/**
 * 単語データをバリデーション
 * @param {unknown[]} words - バリデーション対象の単語データ
 * @returns {ValidationResult}
 */
export function validateWords(words) {
  /** @type {ValidationError[]} */
  const errors = [];

  words.forEach((word, index) => {
    // 必須フィールド: word
    if (typeof word !== 'object' || word === null) {
      errors.push({
        index,
        field: 'word',
        message: 'Word must be an object'
      });
      return;
    }

    const w = /** @type {Record<string, unknown>} */ (word);

    // word フィールド
    if (!w.word || typeof w.word !== 'string') {
      errors.push({
        index,
        field: 'word',
        message: 'Missing or invalid "word" field'
      });
    }

    // meaning フィールド
    if (!w.meaning || typeof w.meaning !== 'string') {
      errors.push({
        index,
        field: 'meaning',
        message: 'Missing or invalid "meaning" field'
      });
    }

    // オプションフィールドの型チェック
    if (w.pronunciation && typeof w.pronunciation !== 'string') {
      errors.push({ index, field: 'pronunciation', message: 'Invalid type' });
    }
    // ... 他のフィールド
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 重複チェック
 * @param {WordData[]} words - 単語データ
 * @returns {string[]} 重複している単語のリスト
 */
export function checkDuplicates(words) {
  const seen = new Set();
  /** @type {string[]} */
  const duplicates = [];

  words.forEach(word => {
    if (seen.has(word.word)) {
      duplicates.push(word.word);
    } else {
      seen.add(word.word);
    }
  });

  return duplicates;
}
```

---

## 学習フローの状態マシン

### セット内の状態遷移

```
┌─────────────┐
│ Set Start   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Show Word   │◄────────┐
└──────┬──────┘         │
       │                │
       ▼                │
┌─────────────┐         │
│ Rate Word   │         │
└──────┬──────┘         │
       │                │
       ├─ Perfect   ────┤ Mark Complete
       ├─ Remembered────┤ Mark Complete
       └─ Forgot    ────┘ Mark for Retry
              │
              ▼
       ┌─────────────┐
       │ More Words? │
       └──────┬──────┘
              │
        Yes───┴───No
         │         │
         └─────┐   ▼
               │ ┌─────────────┐
               │ │  Set End    │
               │ └─────────────┘
               │
               └──► Next Word in Set
```

### ボタン表示ロジック

```javascript
/**
 * 利用可能な評価ボタンを取得
 * ボタン順序: Forgot（赤）、Perfect（オレンジ）、Remembered（青）
 * @param {string} word - 単語
 * @param {StudySet} set - 学習セット
 * @returns {Rating[]} 利用可能な評価のリスト
 */
function getAvailableRatings(word, set) {
  // セット内で Forgot を選択済みの単語は Perfect を非表示
  if (set.forgotWords.has(word)) {
    return ['forgot', 'remembered'];
  }

  return ['forgot', 'perfect', 'remembered'];
}
```

---

## 単語データ（JSON）

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

### データ形式

**必須フィールド:**
- `word`: 英単語（一意な識別子）
- `meaning`: 日本語の意味

**オプションフィールド:**
- `pronunciation`: 発音記号
- `katakana`: カタカナ読み
- `type`: 品詞
- `contextMeaning`: 文脈での意味
- `example`: 例文
- `translation`: 例文の訳
- `sentenceBreakdown`: 文の構造解析
- `wordByWordTranslation`: 単語ごとの訳
- `derivatives`: 派生語リスト

**サンプル:**
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

## データモデル

### 単語ごとの進捗（localStorage）

FSRSアルゴリズムで使用するパラメータを含む進捗情報：

- `word`: 単語（識別子）
- `state`: FSRS の状態（`New` | `Learning` | `Review` | `Relearning`）
- `stability`: 記憶の安定性（日数）
- `difficulty`: 難易度（0-10）
- `retrievability`: 想起可能性（0-1）
- `elapsedDays`: 最後の復習からの経過日数
- `scheduledDays`: 次回復習までの予定日数
- `reps`: 復習回数
- `lapses`: 忘れた回数
- `lastReview`: 最終学習時刻（タイムスタンプ）
- `due`: 次回出題時刻（タイムスタンプ）
- `lastRating`: 最後の評価（`forgot` | `remembered` | `perfect`、優先度スコア計算用）
- `correctCount`: `Forgot` 以外の回答数
- `wrongCount`: `Forgot` の回数
- `totalStudyTimeSec`: その単語に費やした累計秒数
- `isMastered`: Perfect を選択してマスター済みかどうか

### 学習ログ（レポート用）

1回の学習ごとにログを記録：

- `word`: 単語
- `timestamp`: 学習時刻
- `rating`: `forgot` | `remembered` | `perfect`
- `timeSpentSec`: 単語表示から回答までの経過秒数
- `state`: 学習時の状態

### 学習セッション（時間計測用）

学習開始〜終了を1セッションとして管理：

- `id`: セッション ID
- `startAt`: 開始時刻
- `endAt`: 終了時刻（学習中は `null`）
- `totalActiveSec`: 総学習時間（秒）
- `studyCount`: 学習した単語数

### 学習統計情報

学習の継続性を追跡：

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

## SRS アルゴリズム

### 採用アルゴリズム: FSRS (Free Spaced Repetition Scheduler)

このアプリでは **FSRS (Free Spaced Repetition Scheduler)** を採用します。

**FSRSの特徴:**
- **機械学習ベース**: 2万人のユーザーから7億件のレビューデータで学習された最新アルゴリズム（2023年開発）
- **高精度な記憶予測**: 個人の学習履歴を分析し、最適な復習タイミングを提案
- **効率性**: 従来のSM-2と比較して20-30%の復習回数削減を実現
- **実績**: Anki、RemNoteなどの主要SRSアプリで採用

**実装:**
- JavaScript実装: [fsrs.js](https://github.com/open-spaced-repetition/fsrs.js)
- npm パッケージとして提供

**FSRSのパラメータ:**
- **Stability (S)**: 記憶の安定性（日数で表現）
- **Difficulty (D)**: 単語の難易度（0-10のスケール）
- **Retrievability (R)**: 現時点での想起可能性（0-1の確率）

### 評価（Rating）マッピング

ユーザー操作とFSRS評価の対応：

| ユーザーボタン | 内部 rating | FSRS Rating |
|---------------|-------------|-------------|
| `Forgot` | `forgot` | `Again` (1) |
| `Remembered` | `remembered` | `Good` (3) |
| `Perfect` | `perfect` | `Easy` (4) |

### 出題アルゴリズム（5単語1セット制）

**単語選択の優先順位:**

1. **学習対象カード**: `due <= now` のカード（期限超過時間が長い順）
2. **未出題カード**: `state === 'New'` のカード
3. **長期記憶カード**: `scheduledDays >= 30` のカード（最終学習が古い順）

上記から **5単語を選択** して1セットとする。

**セット内ルール:**
- セット内の全単語が `Remembered` または `Perfect` になるまで繰り返し出題
- セット内で `Forgot` を選択した単語の再出題時は、`Perfect` 選択肢を非表示

---

## 実装詳細

### 音声再生

**Web Speech API の実装例:**
```javascript
const utterance = new SpeechSynthesisUtterance(word);
utterance.lang = 'en-US'; // または 'en-GB'
utterance.rate = 0.9; // 再生速度（0.1〜10）
window.speechSynthesis.speak(utterance);
```

**注意事項:**
- ブラウザ・OS 依存で音声品質にばらつきあり
- オフラインでも動作（ブラウザに音声エンジンが含まれている場合）
- iOS Safari ではユーザー操作（タップ）トリガーが必要

### 時間計測

**実装方法:**
- カード表示時に `shownAt` をタイムスタンプで記録
- 回答ボタンクリック時に `timeSpentSec = now - shownAt` を計算
- 学習ログと進捗データの両方に反映

### Report画面の状態マッピング

Report画面では、FSRS内部の状態を以下のようにユーザー向けの表示状態にマッピングします。

**表示用の状態:**

| 表示状態 | 定義 |
|---------|------|
| `Mastered` | `isMastered === true` の単語 |
| `Stable` | `state === 'Review'` かつ `scheduledDays >= 30` の単語 |
| `Learning` | `state === 'Learning'` または `state === 'Relearning'` の単語 |
| `New` | `state === 'New'` の単語 |

**実装例:**

```javascript
/**
 * @typedef {import('../stores/progress.js').WordProgress} WordProgress
 */

/**
 * 表示用の状態
 * @typedef {'Mastered' | 'Stable' | 'Learning' | 'New'} DisplayState
 */

/**
 * FSRS の状態を表示用の状態に変換
 * @param {WordProgress} progress - 単語の進捗情報
 * @returns {DisplayState} 表示用の状態
 */
function getDisplayState(progress) {
  // マスター済み
  if (progress.isMastered) {
    return 'Mastered';
  }

  // 安定状態（長期記憶）
  if (progress.state === 'Review' && progress.scheduledDays >= 30) {
    return 'Stable';
  }

  // 学習中
  if (progress.state === 'Learning' || progress.state === 'Relearning') {
    return 'Learning';
  }

  // 未学習
  return 'New';
}
```

**注意:**
- FSRS内部では「Review」という状態を使用しますが、ユーザー向けには「Study（学習）」と表記します
- 技術的な状態（FSRS State）とユーザー向けの表示状態は明確に区別します

### データのインポート/エクスポート

**エクスポート形式:**
```json
{
  "exportedAt": "2024-01-15T10:30:00Z",
  "progress": { /* 単語ごとの進捗 */ },
  "studyLogs": [ /* 学習ログ */ ],
  "sessions": [ /* セッション情報 */ },
  "stats": { /* 統計情報 */ }
}
```

**インポート動作:**
- ファイルアップロード時に形式の妥当性をチェック
- **既存データを完全に上書き**（マージは行わない）
- インポート完了後、画面をリロード

---

## エラーハンドリング

### JSON 読み込みエラー

**チェック内容:**
- 必須フィールド（`word`, `meaning`）の欠損
- データ型の検証
- JSON パースエラー

**エラー表示例:**
```
Error: Failed to load word data

File: /data/basic.json
Issue: Missing 'meaning' field in word at line 5

Please fix the file and reload the page.
```

### localStorage 書き込みエラー

**発生する状況:**
- ストレージ容量の上限（通常 5〜10MB）
- プライベートモード
- ブラウザの設定で無効化されている

**エラー表示例:**
```
Warning: Failed to save data

Cause: Storage quota exceeded

Solutions:
1. Export your data from Settings
2. Delete unnecessary data
3. Clear browser cache
```

---

## 開発とビルド

詳細な開発手順とコマンドについては [README.md](../README.md) を参照してください。

**主要コマンド:**
- `npm install`: 依存関係のインストール
- `npm run dev`: 開発サーバー起動
- `npm run build`: 本番ビルド
- `npm run validate-words <file>`: 単語データのバリデーション
