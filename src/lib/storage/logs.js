import { STORAGE_KEYS, StorageQuotaExceededError } from './index.js';
import { getTodayStartTimestamp, getTodayEndTimestamp } from '../utils/date.js';

/**
 * @typedef {import('../stores/progress.js').FSRSState} FSRSState
 */

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
	 * 学習ログを保存
	 * @param {StudyLog[]} logs - 学習ログ
	 * @throws {StorageQuotaExceededError}
	 */
	save(logs) {
		try {
			localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
		} catch (error) {
			if (error instanceof DOMException && error.name === 'QuotaExceededError') {
				throw new StorageQuotaExceededError('Failed to save logs');
			}
			throw error;
		}
	},

	/**
	 * 学習ログを追加
	 * @param {StudyLog} log - 学習ログ
	 */
	add(log) {
		const logs = this.load();
		logs.push(log);
		this.save(logs);
	},

	/**
	 * 期間でフィルタリング
	 * @param {Date} startDate - 開始日
	 * @param {Date} endDate - 終了日
	 * @returns {StudyLog[]}
	 */
	filterByDate(startDate, endDate) {
		const logs = this.load();
		return logs.filter(
			(log) => log.timestamp >= startDate.getTime() && log.timestamp <= endDate.getTime()
		);
	},

	/**
	 * 単語ごとのログを取得
	 * @param {string} word - 単語
	 * @returns {StudyLog[]}
	 */
	getByWord(word) {
		const logs = this.load();
		return logs.filter((log) => log.word === word);
	},

	/**
	 * 今日の学習ログを取得（JST基準）
	 * @returns {StudyLog[]}
	 */
	getTodayLogs() {
		const logs = this.load();
		const todayStart = getTodayStartTimestamp();
		const todayEnd = getTodayEndTimestamp();
		return logs.filter((log) => log.timestamp >= todayStart && log.timestamp <= todayEnd);
	},

	/**
	 * 全データを削除
	 */
	clear() {
		localStorage.removeItem(STORAGE_KEYS.LOGS);
	}
};
