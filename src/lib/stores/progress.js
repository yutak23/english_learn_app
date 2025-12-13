import { writable, derived, get } from 'svelte/store';
import { progressStorage } from '../storage/progress.js';

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
 * @property {'forgot' | 'remembered' | 'perfect'} lastRating - 最後の評価（優先度スコア計算用）
 * @property {number} correctCount - Forgot 以外の回答数
 * @property {number} wrongCount - Forgot の回数
 * @property {number} totalStudyTimeSec - 累計学習時間（秒）
 */

/**
 * 進捗データのマップ（word をキーとする）
 * @typedef {Record<string, WordProgress>} ProgressMap
 */

/** @type {import('svelte/store').Writable<ProgressMap>} */
export const progressStore = writable({});

/**
 * 学習済み単語数を取得
 */
export const learnedWordCount = derived(progressStore, ($progress) => {
	return Object.values($progress).filter((p) => p.state !== 'New').length;
});

/**
 * 総学習回数を取得
 */
export const totalReps = derived(progressStore, ($progress) => {
	return Object.values($progress).reduce((sum, p) => sum + p.reps, 0);
});

/**
 * localStorage から進捗データを読み込む
 */
export function loadProgress() {
	const data = progressStorage.load();
	progressStore.set(data);
}

/**
 * localStorage に進捗データを保存
 */
export function saveProgress() {
	const currentProgress = get(progressStore);
	progressStorage.save(currentProgress);
}

/**
 * 単語の進捗を更新
 * @param {string} word - 単語
 * @param {WordProgress} progress - 進捗情報
 */
export function updateProgress(word, progress) {
	progressStore.update((state) => ({
		...state,
		[word]: progress
	}));
	// 自動保存
	saveProgress();
}

/**
 * 単語の進捗を取得
 * @param {string} word - 単語
 * @returns {WordProgress | null}
 */
export function getProgress(word) {
	const currentProgress = get(progressStore);
	return currentProgress[word] || null;
}

/**
 * 進捗データをリセット
 */
export function resetProgress() {
	progressStore.set({});
	progressStorage.clear();
}
