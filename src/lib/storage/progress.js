import { STORAGE_KEYS, StorageQuotaExceededError } from './index.js';

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
	 * @throws {StorageQuotaExceededError}
	 */
	save(progress) {
		try {
			localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
		} catch (error) {
			if (error instanceof DOMException && error.name === 'QuotaExceededError') {
				throw new StorageQuotaExceededError('Failed to save progress');
			}
			throw error;
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
	 */
	update(word, progress) {
		const allProgress = this.load();
		allProgress[word] = progress;
		this.save(allProgress);
	},

	/**
	 * 全データを削除
	 */
	clear() {
		localStorage.removeItem(STORAGE_KEYS.PROGRESS);
	}
};
