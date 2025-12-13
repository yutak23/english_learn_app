import { FSRS, Rating, State, createEmptyCard } from 'ts-fsrs';

/**
 * @typedef {import('../stores/progress.js').WordProgress} WordProgress
 * @typedef {import('../stores/progress.js').FSRSState} FSRSState
 * @typedef {import('../storage/logs.js').Rating} AppRating
 */

/**
 * FSRS スケジューラのラッパー
 */
export class StudyScheduler {
	constructor() {
		// FSRS を初期化（デフォルトパラメータ）
		this.fsrs = new FSRS({});
	}

	/**
	 * アプリの Rating を FSRS の Rating に変換
	 * @param {AppRating} rating - アプリの評価
	 * @returns {Rating.Again | Rating.Good | Rating.Easy} FSRS の Rating (Grade type)
	 * @private
	 */
	mapRating(rating) {
		switch (rating) {
			case 'forgot':
				return Rating.Again;
			case 'remembered':
				return Rating.Good;
			case 'perfect':
				return Rating.Easy;
			default:
				return Rating.Good;
		}
	}

	/**
	 * FSRS の State をアプリの FSRSState に変換
	 * @param {State} state - FSRS の State
	 * @returns {FSRSState}
	 * @private
	 */
	mapState(state) {
		switch (state) {
			case State.New:
				return 'New';
			case State.Learning:
				return 'Learning';
			case State.Review:
				return 'Review';
			case State.Relearning:
				return 'Relearning';
			default:
				return 'New';
		}
	}

	/**
	 * アプリの FSRSState を FSRS の State に変換
	 * @param {FSRSState} state - アプリの FSRSState
	 * @returns {State}
	 * @private
	 */
	mapStateToFSRS(state) {
		switch (state) {
			case 'New':
				return State.New;
			case 'Learning':
				return State.Learning;
			case 'Review':
				return State.Review;
			case 'Relearning':
				return State.Relearning;
			default:
				return State.New;
		}
	}

	/**
	 * 新規カードを作成
	 * @param {string} word - 単語
	 * @returns {WordProgress}
	 */
	createNewCard(word) {
		const now = Date.now();
		return {
			word,
			state: 'New',
			stability: 0,
			difficulty: 0,
			retrievability: 0,
			elapsedDays: 0,
			scheduledDays: 0,
			reps: 0,
			lapses: 0,
			lastReview: 0,
			due: now,
			lastRating: 'remembered',
			correctCount: 0,
			wrongCount: 0,
			totalStudyTimeSec: 0
		};
	}

	/**
	 * 単語を学習してスケジュールを更新
	 * @param {string} word - 単語
	 * @param {WordProgress | null} currentProgress - 現在の進捗（新規の場合は null）
	 * @param {AppRating} rating - 評価
	 * @param {number} timeSpentSec - 回答にかかった時間（秒）
	 * @param {Date} [now] - 現在時刻（デフォルト: new Date()）
	 * @returns {WordProgress} 更新後の進捗
	 */
	schedule(word, currentProgress, rating, timeSpentSec = 0, now = new Date()) {
		const fsrsRating = this.mapRating(rating);

		// 新規カードの場合
		if (!currentProgress || currentProgress.state === 'New') {
			const card = createEmptyCard(now);
			const result = this.fsrs.next(card, now, fsrsRating);
			const nextCard = result.card;

			return {
				word,
				state: this.mapState(nextCard.state),
				stability: nextCard.stability,
				difficulty: nextCard.difficulty,
				retrievability: 0,
				elapsedDays: 0,
				scheduledDays: nextCard.scheduled_days,
				reps: nextCard.reps,
				lapses: nextCard.lapses,
				lastReview: nextCard.last_review?.getTime() || now.getTime(),
				due: nextCard.due.getTime(),
				lastRating: rating,
				correctCount: rating !== 'forgot' ? 1 : 0,
				wrongCount: rating === 'forgot' ? 1 : 0,
				totalStudyTimeSec: timeSpentSec
			};
		}

		// 既存カードの更新
		/** @type {import('ts-fsrs').CardInput} */
		const card = {
			due: new Date(currentProgress.due),
			stability: currentProgress.stability,
			difficulty: currentProgress.difficulty,
			elapsed_days: currentProgress.elapsedDays,
			scheduled_days: currentProgress.scheduledDays,
			learning_steps: 0,
			reps: currentProgress.reps,
			lapses: currentProgress.lapses,
			state: this.mapStateToFSRS(currentProgress.state),
			last_review: currentProgress.lastReview ? new Date(currentProgress.lastReview) : undefined
		};

		const result = this.fsrs.next(card, now, fsrsRating);
		const nextCard = result.card;

		return {
			...currentProgress,
			state: this.mapState(nextCard.state),
			stability: nextCard.stability,
			difficulty: nextCard.difficulty,
			elapsedDays: 0,
			scheduledDays: nextCard.scheduled_days,
			reps: nextCard.reps,
			lapses: nextCard.lapses,
			lastReview: nextCard.last_review?.getTime() || now.getTime(),
			due: nextCard.due.getTime(),
			lastRating: rating,
			correctCount: currentProgress.correctCount + (rating !== 'forgot' ? 1 : 0),
			wrongCount: currentProgress.wrongCount + (rating === 'forgot' ? 1 : 0),
			totalStudyTimeSec: currentProgress.totalStudyTimeSec + timeSpentSec
		};
	}

	/**
	 * 想起可能性を計算
	 * @param {WordProgress} progress - 単語の進捗
	 * @param {Date} [now] - 現在時刻
	 * @returns {number} 想起可能性（0-1）
	 */
	getRetrievability(progress, now = new Date()) {
		if (progress.state === 'New' || progress.stability === 0) {
			return 0;
		}

		const elapsedDays = (now.getTime() - progress.lastReview) / (1000 * 60 * 60 * 24);
		// FSRS の忘却曲線計算
		return Math.pow(1 + elapsedDays / (9 * progress.stability), -1);
	}
}

// シングルトンインスタンス
export const scheduler = new StudyScheduler();
