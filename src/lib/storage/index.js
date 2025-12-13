/**
 * localStorage のキー構成
 */
export const STORAGE_KEYS = {
	PROGRESS: 'ela_v1_progress',
	LOGS: 'ela_v1_study_logs',
	SESSIONS: 'ela_v1_sessions',
	STATS: 'ela_v1_stats',
	WORDS_CONFIG: 'ela_v1_words_config'
};

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

/**
 * localStorage の使用量を計算
 * @returns {{ used: number; total: number; percentage: number }}
 */
export function getStorageUsage() {
	let used = 0;

	for (const key in localStorage) {
		if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
			used += localStorage[key].length * 2; // UTF-16
		}
	}

	// 一般的な localStorage の上限は 5MB
	const total = 5 * 1024 * 1024;
	const percentage = (used / total) * 100;

	return { used, total, percentage };
}

/**
 * 全データをクリア
 */
export function clearAllData() {
	Object.values(STORAGE_KEYS).forEach((key) => {
		localStorage.removeItem(key);
	});
}

/**
 * @typedef {import('../stores/progress.js').ProgressMap} ProgressMap
 * @typedef {import('./logs.js').StudyLog} StudyLog
 * @typedef {import('../stores/session.js').StudySession} StudySession
 * @typedef {import('../stores/stats.js').StudyStats} StudyStats
 */

/**
 * エクスポートデータ形式
 * @typedef {Object} ExportData
 * @property {string} exportedAt - エクスポート日時（ISO 8601）
 * @property {ProgressMap} progress - 進捗データ
 * @property {StudyLog[]} studyLogs - 学習ログ
 * @property {StudySession[]} sessions - セッション情報
 * @property {StudyStats} stats - 統計情報
 */

/**
 * 全データをエクスポート
 * @returns {ExportData}
 */
export function exportAllData() {
	return {
		exportedAt: new Date().toISOString(),
		progress: JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESS) || '{}'),
		studyLogs: JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]'),
		sessions: JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]'),
		stats: JSON.parse(
			localStorage.getItem(STORAGE_KEYS.STATS) ||
				'{"currentStreak":0,"longestStreak":0,"totalStudies":0,"lastStudyDate":""}'
		)
	};
}

/**
 * データをインポート（既存データを上書き）
 * @param {ExportData} data - インポートするデータ
 */
export function importAllData(data) {
	try {
		localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data.progress || {}));
		localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data.studyLogs || []));
		localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions || []));
		localStorage.setItem(
			STORAGE_KEYS.STATS,
			JSON.stringify(
				data.stats || {
					currentStreak: 0,
					longestStreak: 0,
					totalStudies: 0,
					lastStudyDate: ''
				}
			)
		);
	} catch (error) {
		if (error instanceof DOMException && error.name === 'QuotaExceededError') {
			throw new StorageQuotaExceededError('Failed to import data: Storage quota exceeded');
		}
		throw error;
	}
}
