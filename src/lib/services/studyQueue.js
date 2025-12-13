/**
 * @typedef {import('../stores/words.js').WordData} WordData
 * @typedef {import('../stores/progress.js').WordProgress} WordProgress
 * @typedef {import('../stores/progress.js').ProgressMap} ProgressMap
 */

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
 * @property {WordProgress | null} progress - 進捗情報
 * @property {number} shownAt - 表示開始時刻
 * @property {boolean} meaningVisible - 意味の表示/非表示
 */

const SET_SIZE = 5;

/**
 * 単語の出題優先度スコアを計算
 * @param {WordProgress | null} progress - 単語の進捗情報（未学習の場合は null）
 * @returns {number} 優先度スコア（高いほど優先）
 */
export function calculatePriorityScore(progress) {
	// 未学習の単語
	if (!progress || progress.state === 'New') {
		return 100;
	}

	// 基本スコア
	const baseScore = 50;

	// 最終評価係数
	const lastRatingFactors = {
		forgot: 1.5,
		remembered: 1.2,
		perfect: 1.0
	};
	const lastRatingFactor = lastRatingFactors[progress.lastRating] || 1.0;

	// 期限超過率（最小1.0）
	const elapsedDays = (Date.now() - progress.lastReview) / (1000 * 60 * 60 * 24);
	const overdueRatio = Math.max(1, elapsedDays / Math.max(1, progress.scheduledDays));

	return baseScore * lastRatingFactor * overdueRatio;
}

/**
 * 学習キュー管理クラス
 */
export class StudyQueue {
	/**
	 * 5単語を選択して学習セットを作成
	 * priorityScore が高い順に選択
	 * @param {WordData[]} words - 全単語データ
	 * @param {ProgressMap} progressMap - 進捗データ
	 * @returns {StudySet} 学習セット
	 */
	createSet(words, progressMap) {
		const wordList = words.map((w) => w.word);

		// 全単語の優先度スコアを計算してソート
		const scoredWords = wordList.map((word) => ({
			word,
			score: calculatePriorityScore(progressMap[word] || null)
		}));

		// スコアが高い順にソート
		scoredWords.sort((a, b) => b.score - a.score);

		// 上位5単語（または全単語数が5未満の場合はその数）を選択
		const selectedWords = scoredWords
			.slice(0, Math.min(SET_SIZE, scoredWords.length))
			.map((item) => item.word);

		return {
			words: selectedWords,
			completedWords: new Set(),
			forgotWords: new Set()
		};
	}

	/**
	 * セット内の次の単語を取得
	 * @param {StudySet} set - 学習セット
	 * @returns {string | null} 次の単語（完了時は null）
	 */
	getNextWord(set) {
		const remaining = set.words.filter((word) => !set.completedWords.has(word));

		if (remaining.length === 0) return null;

		// Forgot を選択した単語を優先的に出題
		const forgotRemaining = remaining.filter((w) => set.forgotWords.has(w));
		if (forgotRemaining.length > 0) {
			return forgotRemaining[0];
		}

		return remaining[0];
	}

	/**
	 * 単語の回答を記録
	 * @param {StudySet} set - 学習セット
	 * @param {string} word - 単語
	 * @param {'forgot' | 'remembered' | 'perfect'} rating - 評価
	 * @returns {StudySet} 更新されたセット
	 */
	recordAnswer(set, word, rating) {
		const newSet = {
			words: set.words,
			completedWords: new Set(set.completedWords),
			forgotWords: new Set(set.forgotWords)
		};

		if (rating === 'forgot') {
			// Forgot の場合は forgotWords に追加し、completedWords からは削除しない（まだ完了していない）
			newSet.forgotWords.add(word);
		} else {
			// Remembered または Perfect の場合は完了
			newSet.completedWords.add(word);
		}

		return newSet;
	}

	/**
	 * セットが完了したか判定
	 * @param {StudySet} set - 学習セット
	 * @returns {boolean}
	 */
	isSetComplete(set) {
		return set.completedWords.size === set.words.length;
	}

	/**
	 * セット内の進捗を取得
	 * @param {StudySet} set - 学習セット
	 * @returns {{ current: number; total: number }}
	 */
	getSetProgress(set) {
		return {
			current: set.completedWords.size,
			total: set.words.length
		};
	}

	/**
	 * 単語が Forgot 済みかどうかを確認
	 * @param {StudySet} set - 学習セット
	 * @param {string} word - 単語
	 * @returns {boolean}
	 */
	hasForgotten(set, word) {
		return set.forgotWords.has(word);
	}
}

// シングルトンインスタンス
export const studyQueue = new StudyQueue();
