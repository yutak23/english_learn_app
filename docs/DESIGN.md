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
│   │   ├── words.ts
│   │   ├── progress.ts
│   │   ├── session.ts
│   │   └── stats.ts
│   ├── services/        # ビジネスロジック
│   │   ├── scheduler.ts # FSRS統合
│   │   ├── studyQueue.ts # 出題管理
│   │   └── speech.ts    # 音声再生
│   ├── storage/         # localStorage操作
│   │   ├── index.ts     # 統合API
│   │   ├── progress.ts
│   │   ├── logs.ts
│   │   └── sessions.ts
│   ├── types/           # TypeScript型定義
│   │   └── index.ts
│   └── utils/           # ユーティリティ
│       ├── validator.ts
│       ├── time.ts
│       └── date.ts
├── data/                # 単語データ（JSON）
│   └── basic.json
└── static/              # 静的アセット
```

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

## TypeScript 型定義

### 単語データ

```typescript
// src/lib/types/index.ts

/**
 * JSON から読み込む単語データ
 */
export interface WordData {
  word: string;                    // 必須: 英単語（一意な識別子）
  meaning: string;                 // 必須: 日本語の意味
  pronunciation?: string;          // 発音記号
  katakana?: string;              // カタカナ読み
  type?: string;                  // 品詞
  contextMeaning?: string;        // 文脈での意味
  example?: string;               // 例文
  translation?: string;           // 例文の訳
  sentenceBreakdown?: string;     // 文の構造解析
  wordByWordTranslation?: string; // 単語ごとの訳
  derivatives?: string[];         // 派生語リスト
}

/**
 * 単語設定ファイル
 */
export interface WordsConfig {
  wordFiles: string[];
}
```

### 学習進捗

```typescript
/**
 * FSRS の状態
 */
export type FSRSState = 'New' | 'Learning' | 'Review' | 'Relearning';

/**
 * 単語ごとの進捗情報
 */
export interface WordProgress {
  word: string;                    // 単語（識別子）
  state: FSRSState;               // FSRS の状態
  stability: number;              // 記憶の安定性（日数）
  difficulty: number;             // 難易度（0-10）
  retrievability: number;         // 想起可能性（0-1）
  elapsedDays: number;            // 最後の復習からの経過日数
  scheduledDays: number;          // 次回復習までの予定日数
  reps: number;                   // 復習回数
  lapses: number;                 // 忘れた回数
  lastReview: number;             // 最終学習時刻（タイムスタンプ）
  due: number;                    // 次回出題時刻（タイムスタンプ）
  correctCount: number;           // Forgot 以外の回答数
  wrongCount: number;             // Forgot の回数
  totalStudyTimeSec: number;      // 累計学習時間（秒）
}

/**
 * 進捗データのマップ（word をキーとする）
 */
export type ProgressMap = Record<string, WordProgress>;
```

### 学習ログとセッション

```typescript
/**
 * ユーザーの評価
 */
export type Rating = 'forgot' | 'remembered' | 'perfect';

/**
 * 学習ログ
 */
export interface StudyLog {
  word: string;          // 単語
  timestamp: number;     // 学習時刻
  rating: Rating;        // 評価
  timeSpentSec: number;  // 回答時間（秒）
  state: FSRSState;      // 学習時の状態
}

/**
 * 学習セッション
 */
export interface StudySession {
  id: string;            // セッション ID
  startAt: number;       // 開始時刻
  endAt: number | null;  // 終了時刻（学習中は null）
  totalActiveSec: number; // 総学習時間（秒）
  studyCount: number;    // 学習した単語数
}
```

### 統計情報

```typescript
/**
 * 学習統計情報
 */
export interface StudyStats {
  currentStreak: number;  // 現在の連続学習日数
  longestStreak: number;  // 最長の連続学習日数
  totalStudies: number;   // 総学習回数
  lastStudyDate: string;  // 最後に学習した日付（YYYY-MM-DD）
}
```

### 学習フロー

```typescript
/**
 * 学習セット（5単語1セット）
 */
export interface StudySet {
  words: string[];              // セット内の単語リスト
  completedWords: Set<string>;  // 完了した単語（Remembered または Perfect）
  forgotWords: Set<string>;     // Forgot を選択した単語
}

/**
 * 現在学習中の単語情報
 */
export interface CurrentStudy {
  word: string;           // 単語
  wordData: WordData;     // 単語データ
  progress: WordProgress; // 進捗情報
  shownAt: number;        // 表示開始時刻
  meaningVisible: boolean; // 意味の表示/非表示
}
```

### エクスポート/インポート

```typescript
/**
 * エクスポートデータ形式
 */
export interface ExportData {
  exportedAt: string;                    // エクスポート日時（ISO 8601）
  progress: ProgressMap;                 // 進捗データ
  studyLogs: StudyLog[];                 // 学習ログ
  sessions: StudySession[];              // セッション情報
  stats: StudyStats;                     // 統計情報
}
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

### 1. wordsStore (`src/lib/stores/words.ts`)

**責務:** 単語データの管理

```typescript
import { writable, derived } from 'svelte/store';
import type { WordData } from '$lib/types';

interface WordsState {
  words: WordData[];
  loading: boolean;
  error: string | null;
}

export const wordsStore = writable<WordsState>({
  words: [],
  loading: false,
  error: null
});

// 単語をマップ形式で取得（word をキーとする）
export const wordsMap = derived(
  wordsStore,
  ($words) => new Map($words.words.map(w => [w.word, w]))
);
```

**主要メソッド:**
- `loadWords(config: WordsConfig): Promise<void>` - 単語データを読み込む
- `validateWords(): boolean` - 単語データのバリデーション

### 2. progressStore (`src/lib/stores/progress.ts`)

**責務:** 学習進捗の管理

```typescript
import { writable } from 'svelte/store';
import type { ProgressMap, WordProgress } from '$lib/types';

export const progressStore = writable<ProgressMap>({});

// 主要メソッド
export const progressActions = {
  load: () => { /* localStorage から読み込み */ },
  save: () => { /* localStorage に保存 */ },
  update: (word: string, progress: WordProgress) => { /* 進捗更新 */ },
  get: (word: string): WordProgress | null => { /* 進捗取得 */ }
};
```

### 3. sessionStore (`src/lib/stores/session.ts`)

**責務:** 学習セッションの管理

```typescript
import { writable, derived } from 'svelte/store';
import type { StudySession } from '$lib/types';

interface SessionState {
  current: StudySession | null;
  isActive: boolean;
}

export const sessionStore = writable<SessionState>({
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
```

**主要メソッド:**
- `startSession(): void` - セッション開始
- `endSession(): void` - セッション終了
- `updateSession(studyCount: number): void` - セッション情報更新

### 4. statsStore (`src/lib/stores/stats.ts`)

**責務:** 学習統計の管理

```typescript
import { writable } from 'svelte/store';
import type { StudyStats } from '$lib/types';

export const statsStore = writable<StudyStats>({
  currentStreak: 0,
  longestStreak: 0,
  totalStudies: 0,
  lastStudyDate: ''
});
```

**主要メソッド:**
- `updateStreak(date: string): void` - ストリーク更新
- `incrementTotalStudies(): void` - 総学習回数をインクリメント

---

## localStorage 層 API 設計

### 基本設計

**キー構成:**
```typescript
const STORAGE_KEYS = {
  PROGRESS: 'ela_v1_progress',
  LOGS: 'ela_v1_study_logs',
  SESSIONS: 'ela_v1_sessions',
  STATS: 'ela_v1_stats'
} as const;
```

### API インターフェース

#### Progress API (`src/lib/storage/progress.ts`)

```typescript
export const progressStorage = {
  /**
   * 進捗データを読み込む
   */
  load(): ProgressMap {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return data ? JSON.parse(data) : {};
  },

  /**
   * 進捗データを保存
   */
  save(progress: ProgressMap): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
    } catch (error) {
      throw new StorageQuotaExceededError('Failed to save progress');
    }
  },

  /**
   * 単語の進捗を取得
   */
  get(word: string): WordProgress | null {
    const progress = this.load();
    return progress[word] || null;
  },

  /**
   * 単語の進捗を更新
   */
  update(word: string, progress: WordProgress): void {
    const allProgress = this.load();
    allProgress[word] = progress;
    this.save(allProgress);
  },

  /**
   * 全データを削除
   */
  clear(): void {
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
  }
};
```

#### Logs API (`src/lib/storage/logs.ts`)

```typescript
export const logsStorage = {
  /**
   * 学習ログを読み込む
   */
  load(): StudyLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },

  /**
   * 学習ログを追加
   */
  add(log: StudyLog): void {
    const logs = this.load();
    logs.push(log);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },

  /**
   * 期間でフィルタリング
   */
  filterByDate(startDate: Date, endDate: Date): StudyLog[] {
    const logs = this.load();
    return logs.filter(log =>
      log.timestamp >= startDate.getTime() &&
      log.timestamp <= endDate.getTime()
    );
  },

  /**
   * 単語ごとのログを取得
   */
  getByWord(word: string): StudyLog[] {
    const logs = this.load();
    return logs.filter(log => log.word === word);
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEYS.LOGS);
  }
};
```

#### Sessions API (`src/lib/storage/sessions.ts`)

```typescript
export const sessionsStorage = {
  load(): StudySession[] { /* ... */ },
  add(session: StudySession): void { /* ... */ },
  update(sessionId: string, updates: Partial<StudySession>): void { /* ... */ },
  clear(): void { /* ... */ }
};
```

#### Stats API (`src/lib/storage/stats.ts`)

```typescript
export const statsStorage = {
  load(): StudyStats { /* ... */ },
  save(stats: StudyStats): void { /* ... */ },
  clear(): void { /* ... */ }
};
```

### エラーハンドリング

```typescript
/**
 * ストレージ容量超過エラー
 */
export class StorageQuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageQuotaExceededError';
  }
}

/**
 * データ破損エラー
 */
export class DataCorruptionError extends Error {
  constructor(message: string) {
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

### Scheduler サービス (`src/lib/services/scheduler.ts`)

```typescript
import { FSRS, Rating, State } from 'fsrs';
import type { WordProgress, Rating as AppRating } from '$lib/types';

/**
 * FSRS スケジューラのラッパー
 */
export class StudyScheduler {
  private fsrs: FSRS;

  constructor() {
    // FSRS を初期化（デフォルトパラメータ）
    this.fsrs = new FSRS();
  }

  /**
   * アプリの Rating を FSRS の Rating に変換
   */
  private mapRating(rating: AppRating): Rating {
    switch (rating) {
      case 'forgot':
        return Rating.Again;
      case 'remembered':
        return Rating.Good; // または Hard
      case 'perfect':
        return Rating.Easy;
    }
  }

  /**
   * FSRS の State をアプリの FSRSState に変換
   */
  private mapState(state: State): FSRSState {
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
   * 単語を学習してスケジュールを更新
   */
  schedule(
    word: string,
    currentProgress: WordProgress | null,
    rating: AppRating,
    now: Date = new Date()
  ): WordProgress {
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
        correctCount: rating !== 'forgot' ? 1 : 0,
        wrongCount: rating === 'forgot' ? 1 : 0,
        totalStudyTimeSec: 0
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
      correctCount: currentProgress.correctCount + (rating !== 'forgot' ? 1 : 0),
      wrongCount: currentProgress.wrongCount + (rating === 'forgot' ? 1 : 0)
    };
  }

  private mapStateToFSRS(state: FSRSState): State {
    switch (state) {
      case 'New': return State.New;
      case 'Learning': return State.Learning;
      case 'Review': return State.Review;
      case 'Relearning': return State.Relearning;
    }
  }
}

// シングルトンインスタンス
export const scheduler = new StudyScheduler();
```

---

## 学習フロー（Study Queue）設計

### 出題管理 (`src/lib/services/studyQueue.ts`)

```typescript
import type { WordData, WordProgress, ProgressMap } from '$lib/types';

export class StudyQueue {
  /**
   * 5単語を選択して学習セットを作成
   */
  selectWords(
    words: WordData[],
    progressMap: ProgressMap
  ): string[] {
    const now = Date.now();
    const wordList = words.map(w => w.word);

    // 優先度1: 期限切れカード
    const dueCards = wordList
      .filter(word => {
        const progress = progressMap[word];
        return progress && progress.due <= now;
      })
      .sort((a, b) => {
        const progressA = progressMap[a]!;
        const progressB = progressMap[b]!;
        return progressA.due - progressB.due; // 期限超過時間が長い順
      });

    // 優先度2: 未出題カード
    const newCards = wordList.filter(word => !progressMap[word]);

    // 優先度3: 長期記憶カード
    const longTermCards = wordList
      .filter(word => {
        const progress = progressMap[word];
        return progress && progress.scheduledDays >= 30;
      })
      .sort((a, b) => {
        const progressA = progressMap[a]!;
        const progressB = progressMap[b]!;
        return progressA.lastReview - progressB.lastReview; // 古い順
      });

    // 5単語を選択
    const selected: string[] = [];
    const allCandidates = [...dueCards, ...newCards, ...longTermCards];

    for (const word of allCandidates) {
      if (!selected.includes(word)) {
        selected.push(word);
      }
      if (selected.length >= 5) break;
    }

    // 5単語に満たない場合はランダムに追加
    if (selected.length < 5) {
      const remaining = wordList.filter(w => !selected.includes(w));
      const shuffled = remaining.sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, 5 - selected.length));
    }

    return selected.slice(0, 5);
  }

  /**
   * セット内の次の単語を取得
   */
  getNextWord(
    set: StudySet
  ): string | null {
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
   */
  isSetComplete(set: StudySet): boolean {
    return set.completedWords.size === set.words.length;
  }
}

export const studyQueue = new StudyQueue();
```

---

## コンポーネント設計

### 主要コンポーネント

#### 1. WordCard (`src/lib/components/WordCard.svelte`)

**責務:** 単語カードの表示

**Props:**
```typescript
export let wordData: WordData;
export let meaningVisible: boolean = false;
export let onSpeakWord: (word: string) => void;
```

**表示内容:**
- 英単語、発音記号、品詞
- 意味（表示/非表示切り替え可能）
- 例文と訳
- スピーカーアイコン

#### 2. RatingButtons (`src/lib/components/RatingButtons.svelte`)

**責務:** 評価ボタンの表示

**Props:**
```typescript
export let onRate: (rating: Rating) => void;
export let hidePerfect: boolean = false; // Forgot後は Perfect を非表示
```

**表示:**
- `Forgot` ボタン（赤）
- `Remembered` ボタン（黄）
- `Perfect` ボタン（緑、条件により非表示）

#### 3. SessionControl (`src/lib/components/SessionControl.svelte`)

**責務:** セッション制御のフローティングボタン

**Props:**
```typescript
export let isActive: boolean;
export let onStart: () => void;
export let onStop: () => void;
```

#### 4. ProgressIndicator (`src/lib/components/ProgressIndicator.svelte`)

**責務:** 学習進捗の表示

**Props:**
```typescript
export let todayCount: number;
export let totalCount: number;
export let setProgress: { current: number; total: number };
```

---

## バリデーション設計

### 単語データのバリデーション (`src/lib/utils/validator.ts`)

```typescript
import type { WordData } from '$lib/types';

export interface ValidationError {
  index: number;
  field: string;
  message: string;
}

/**
 * 単語データをバリデーション
 */
export function validateWords(words: unknown[]): {
  valid: boolean;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

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

    const w = word as Record<string, unknown>;

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
 */
export function checkDuplicates(words: WordData[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];

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

```typescript
function getAvailableRatings(
  word: string,
  set: StudySet
): Rating[] {
  // セット内で Forgot を選択済みの単語は Perfect を非表示
  if (set.forgotWords.has(word)) {
    return ['forgot', 'remembered'];
  }

  return ['forgot', 'remembered', 'perfect'];
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
- `correctCount`: `Forgot` 以外の回答数
- `wrongCount`: `Forgot` の回数
- `totalStudyTimeSec`: その単語に費やした累計秒数

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

### データのインポート/エクスポート

**エクスポート形式:**
```json
{
  "exportedAt": "2024-01-15T10:30:00Z",
  "progress": { /* 単語ごとの進捗 */ },
  "studyLogs": [ /* 学習ログ */ ],
  "sessions": [ /* セッション情報 */ ],
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
