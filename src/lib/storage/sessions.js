import { STORAGE_KEYS, StorageQuotaExceededError } from './index.js';

/**
 * @typedef {import('../stores/session.js').StudySession} StudySession
 */

export const sessionsStorage = {
	/**
	 * セッションデータを読み込む
	 * @returns {StudySession[]}
	 */
	load() {
		const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
		return data ? JSON.parse(data) : [];
	},

	/**
	 * セッションデータを保存
	 * @param {StudySession[]} sessions - セッションデータ
	 * @throws {StorageQuotaExceededError}
	 */
	save(sessions) {
		try {
			localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
		} catch (error) {
			if (error instanceof DOMException && error.name === 'QuotaExceededError') {
				throw new StorageQuotaExceededError('Failed to save sessions');
			}
			throw error;
		}
	},

	/**
	 * セッションを追加
	 * @param {StudySession} session - セッション情報
	 */
	add(session) {
		const sessions = this.load();
		sessions.push(session);
		this.save(sessions);
	},

	/**
	 * セッションを更新
	 * @param {string} sessionId - セッション ID
	 * @param {Partial<StudySession>} updates - 更新内容
	 */
	update(sessionId, updates) {
		const sessions = this.load();
		const index = sessions.findIndex((s) => s.id === sessionId);
		if (index !== -1) {
			sessions[index] = { ...sessions[index], ...updates };
			this.save(sessions);
		}
	},

	/**
	 * アクティブなセッションを取得
	 * @returns {StudySession | null}
	 */
	getActive() {
		const sessions = this.load();
		return sessions.find((s) => s.endAt === null) || null;
	},

	/**
	 * 全データを削除
	 */
	clear() {
		localStorage.removeItem(STORAGE_KEYS.SESSIONS);
	}
};
