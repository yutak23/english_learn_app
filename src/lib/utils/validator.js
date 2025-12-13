/**
 * @typedef {import('../stores/words.js').WordData} WordData
 */

/**
 * バリデーションエラー
 * @typedef {Object} ValidationError
 * @property {number} index - エラーが発生した単語のインデックス
 * @property {string} field - エラーが発生したフィールド名
 * @property {string} message - エラーメッセージ
 */

/**
 * バリデーション結果
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - バリデーションが成功したか
 * @property {ValidationError[]} errors - エラーの配列
 */

/**
 * 単語データをバリデーション
 * @param {unknown[]} words - バリデーション対象の単語データ
 * @returns {ValidationResult}
 */
export function validateWords(words) {
	/** @type {ValidationError[]} */
	const errors = [];

	if (!Array.isArray(words)) {
		errors.push({
			index: -1,
			field: 'root',
			message: 'Word data must be an array'
		});
		return { valid: false, errors };
	}

	words.forEach((word, index) => {
		if (typeof word !== 'object' || word === null) {
			errors.push({
				index,
				field: 'word',
				message: 'Word must be an object'
			});
			return;
		}

		const w = /** @type {Record<string, unknown>} */ (word);

		// word フィールド（必須）
		if (!w.word || typeof w.word !== 'string') {
			errors.push({
				index,
				field: 'word',
				message: 'Missing or invalid "word" field'
			});
		}

		// meaning フィールド（必須）
		if (!w.meaning || typeof w.meaning !== 'string') {
			errors.push({
				index,
				field: 'meaning',
				message: 'Missing or invalid "meaning" field'
			});
		}

		// オプションフィールドの型チェック
		const stringFields = [
			'pronunciation',
			'katakana',
			'type',
			'contextMeaning',
			'example',
			'translation',
			'sentenceBreakdown',
			'wordByWordTranslation',
			'note'
		];

		stringFields.forEach((field) => {
			if (w[field] !== undefined && typeof w[field] !== 'string') {
				errors.push({
					index,
					field,
					message: `Invalid type for "${field}" field (expected string)`
				});
			}
		});

		// derivatives フィールドの型チェック
		if (w.derivatives !== undefined) {
			if (!Array.isArray(w.derivatives)) {
				errors.push({
					index,
					field: 'derivatives',
					message: 'Invalid type for "derivatives" field (expected array)'
				});
			} else {
				w.derivatives.forEach((derivative, derivIndex) => {
					if (typeof derivative !== 'object' || derivative === null) {
						errors.push({
							index,
							field: `derivatives[${derivIndex}]`,
							message: 'Derivative must be an object'
						});
						return;
					}

					const d = /** @type {Record<string, unknown>} */ (derivative);
					if (!d.word || typeof d.word !== 'string') {
						errors.push({
							index,
							field: `derivatives[${derivIndex}].word`,
							message: 'Missing or invalid "word" field in derivative'
						});
					}
				});
			}
		}
	});

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * 重複チェック
 * @param {WordData[]} words - 単語データ
 * @returns {string[]} 重複している単語のリスト
 */
export function checkDuplicates(words) {
	/** @type {Set<string>} */
	const seen = new Set();
	/** @type {string[]} */
	const duplicates = [];

	words.forEach((word) => {
		if (seen.has(word.word)) {
			if (!duplicates.includes(word.word)) {
				duplicates.push(word.word);
			}
		} else {
			seen.add(word.word);
		}
	});

	return duplicates;
}
