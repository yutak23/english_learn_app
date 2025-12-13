import { writable, get } from 'svelte/store';
import { statsStorage } from '../storage/stats.js';
import { getTodayDateString, getYesterdayDateString } from '../utils/date.js';

/**
 * 学習統計情報
 * @typedef {Object} StudyStats
 * @property {number} currentStreak - 現在の連続学習日数
 * @property {number} longestStreak - 最長の連続学習日数
 * @property {number} totalStudies - 総学習回数
 * @property {string} lastStudyDate - 最後に学習した日付（YYYY-MM-DD）
 */

/** @type {import('svelte/store').Writable<StudyStats>} */
export const statsStore = writable({
	currentStreak: 0,
	longestStreak: 0,
	totalStudies: 0,
	lastStudyDate: ''
});

/**
 * localStorage から統計データを読み込む
 */
export function loadStats() {
	const data = statsStorage.load();
	statsStore.set(data);
}

/**
 * localStorage に統計データを保存
 */
export function saveStats() {
	const currentStats = get(statsStore);
	statsStorage.save(currentStats);
}

/**
 * ストリーク更新
 * @param {string} [date] - 日付（YYYY-MM-DD）、省略時は今日
 */
export function updateStreak(date) {
	const todayDate = date || getTodayDateString();
	const yesterdayDate = getYesterdayDateString();

	statsStore.update((state) => {
		// 既に今日学習済みの場合は何もしない
		if (state.lastStudyDate === todayDate) {
			return state;
		}

		let newStreak = 1;

		// 昨日学習していた場合はストリークを継続
		if (state.lastStudyDate === yesterdayDate) {
			newStreak = state.currentStreak + 1;
		}

		const newLongestStreak = Math.max(state.longestStreak, newStreak);

		return {
			...state,
			currentStreak: newStreak,
			longestStreak: newLongestStreak,
			lastStudyDate: todayDate
		};
	});

	saveStats();
}

/**
 * 総学習回数をインクリメント
 */
export function incrementTotalStudies() {
	statsStore.update((state) => ({
		...state,
		totalStudies: state.totalStudies + 1
	}));
	saveStats();
}

/**
 * 統計データをリセット
 */
export function resetStats() {
	statsStore.set({
		currentStreak: 0,
		longestStreak: 0,
		totalStudies: 0,
		lastStudyDate: ''
	});
	statsStorage.clear();
}
