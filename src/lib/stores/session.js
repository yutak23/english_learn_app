import { writable, derived } from 'svelte/store';
import { sessionsStorage } from '../storage/sessions.js';

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

/** @type {import('svelte/store').Writable<SessionState>} */
export const sessionStore = writable({
	current: null,
	isActive: false
});

/**
 * アクティブな学習時間を計算（リアクティブ）
 */
export const activeTime = derived(sessionStore, ($session) => {
	if (!$session.isActive || !$session.current) return 0;
	return Math.floor((Date.now() - $session.current.startAt) / 1000);
});

/**
 * ユニークなセッション ID を生成
 * @returns {string}
 */
function generateSessionId() {
	return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * セッション開始
 */
export function startSession() {
	const now = Date.now();
	/** @type {StudySession} */
	const session = {
		id: generateSessionId(),
		startAt: now,
		endAt: null,
		totalActiveSec: 0,
		studyCount: 0
	};

	sessionStore.set({
		current: session,
		isActive: true
	});

	sessionsStorage.add(session);
}

/**
 * セッション終了
 */
export function endSession() {
	sessionStore.update((state) => {
		if (!state.current) return state;

		const now = Date.now();
		const totalActiveSec = Math.floor((now - state.current.startAt) / 1000);

		const endedSession = {
			...state.current,
			endAt: now,
			totalActiveSec
		};

		// localStorage に保存
		sessionsStorage.update(state.current.id, {
			endAt: now,
			totalActiveSec
		});

		return {
			current: endedSession,
			isActive: false
		};
	});
}

/**
 * セッション情報更新（学習数をインクリメント）
 */
export function incrementStudyCount() {
	sessionStore.update((state) => {
		if (!state.current) return state;

		const updatedSession = {
			...state.current,
			studyCount: state.current.studyCount + 1
		};

		// localStorage に保存
		sessionsStorage.update(state.current.id, {
			studyCount: updatedSession.studyCount
		});

		return {
			...state,
			current: updatedSession
		};
	});
}

/**
 * 既存のアクティブセッションを復元
 */
export function restoreSession() {
	const activeSession = sessionsStorage.getActive();
	if (activeSession) {
		sessionStore.set({
			current: activeSession,
			isActive: true
		});
	}
}

/**
 * セッションをリセット
 */
export function resetSession() {
	sessionStore.set({
		current: null,
		isActive: false
	});
}
