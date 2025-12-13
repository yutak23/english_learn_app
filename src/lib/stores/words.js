import { writable, derived } from 'svelte/store';
import { validateWords, checkDuplicates } from '../utils/validator.js';

/**
 * 派生語データ
 * @typedef {Object} DerivativeWord
 * @property {string} word - 派生語
 * @property {string} [pronunciation] - 発音記号
 * @property {string} [katakana] - カタカナ読み
 * @property {string} [type] - 品詞
 * @property {string} [meaning] - 意味
 * @property {string} [example] - 例文
 */

/**
 * JSON から読み込む単語データ
 * @typedef {Object} WordData
 * @property {string} word - 必須: 英単語（一意な識別子）
 * @property {string} meaning - 必須: 日本語の意味
 * @property {string} [pronunciation] - 発音記号
 * @property {string} [katakana] - カタカナ読み
 * @property {string} [type] - 品詞
 * @property {string} [contextMeaning] - 文脈での意味
 * @property {string} [example] - 例文
 * @property {string} [translation] - 例文の訳
 * @property {string} [sentenceBreakdown] - 文の構造解析
 * @property {string} [wordByWordTranslation] - 単語ごとの訳
 * @property {string} [note] - 補足説明・注釈
 * @property {DerivativeWord[]} [derivatives] - 派生語リスト
 */

/**
 * 単語設定ファイル
 * @typedef {Object} WordsConfig
 * @property {string[]} wordFiles - 読み込む単語ファイルのパス
 */

/**
 * 単語ストアの状態
 * @typedef {Object} WordsState
 * @property {WordData[]} words - 単語データの配列
 * @property {boolean} loading - 読み込み中かどうか
 * @property {string | null} error - エラーメッセージ
 */

/** @type {import('svelte/store').Writable<WordsState>} */
export const wordsStore = writable({
	words: [],
	loading: false,
	error: null
});

/**
 * 単語をマップ形式で取得（word をキーとする）
 */
export const wordsMap = derived(wordsStore, ($words) => {
	/** @type {Map<string, WordData>} */
	const map = new Map();
	$words.words.forEach((w) => map.set(w.word, w));
	return map;
});

/**
 * 単語数を取得
 */
export const wordCount = derived(wordsStore, ($words) => $words.words.length);

/**
 * 単語データを読み込む
 * @param {WordsConfig} config - 単語ファイルの設定
 * @returns {Promise<void>}
 */
export async function loadWords(config) {
	wordsStore.update((state) => ({
		...state,
		loading: true,
		error: null
	}));

	try {
		/** @type {WordData[]} */
		const allWords = [];

		for (const filePath of config.wordFiles) {
			const response = await fetch(filePath);

			if (!response.ok) {
				throw new Error(`Failed to load ${filePath}: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			const validation = validateWords(data);

			if (!validation.valid) {
				const errorDetails = validation.errors
					.slice(0, 5)
					.map((e) => `[${e.index}] ${e.field}: ${e.message}`)
					.join('\n');
				throw new Error(`Validation failed for ${filePath}:\n${errorDetails}`);
			}

			allWords.push(.../** @type {WordData[]} */ (data));
		}

		// 重複チェック
		const duplicates = checkDuplicates(allWords);
		if (duplicates.length > 0) {
			throw new Error(`Duplicate words found: ${duplicates.join(', ')}`);
		}

		wordsStore.set({
			words: allWords,
			loading: false,
			error: null
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error loading words';
		wordsStore.set({
			words: [],
			loading: false,
			error: message
		});
	}
}

/**
 * 単語ストアをリセット
 */
export function resetWords() {
	wordsStore.set({
		words: [],
		loading: false,
		error: null
	});
}
