import { STORAGE_KEYS, StorageQuotaExceededError } from './index.js';

/**
 * @typedef {import('../stores/stats.js').StudyStats} StudyStats
 */

/** @type {StudyStats} */
const DEFAULT_STATS = {
	currentStreak: 0,
	longestStreak: 0,
	totalStudies: 0,
	lastStudyDate: ''
};

export const statsStorage = {
	/**
	 * 統計データを読み込む
	 * @returns {StudyStats}
	 */
	load() {
		const data = localStorage.getItem(STORAGE_KEYS.STATS);
		return data ? JSON.parse(data) : { ...DEFAULT_STATS };
	},

	/**
	 * 統計データを保存
	 * @param {StudyStats} stats - 統計情報
	 * @throws {StorageQuotaExceededError}
	 */
	save(stats) {
		try {
			localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
		} catch (error) {
			if (error instanceof DOMException && error.name === 'QuotaExceededError') {
				throw new StorageQuotaExceededError('Failed to save stats');
			}
			throw error;
		}
	},

	/**
	 * 全データを削除
	 */
	clear() {
		localStorage.removeItem(STORAGE_KEYS.STATS);
	}
};
