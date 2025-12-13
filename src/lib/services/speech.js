/**
 * 英単語を音声で再生
 * @param {string} word - 再生する単語
 * @param {object} [options] - オプション
 * @param {string} [options.lang='en-US'] - 言語
 * @param {number} [options.rate=0.9] - 再生速度（0.1〜10）
 * @returns {Promise<void>}
 */
export function speakWord(word, options = {}) {
	return new Promise((resolve, reject) => {
		if (!('speechSynthesis' in window)) {
			reject(new Error('Speech synthesis not supported'));
			return;
		}

		// 既に再生中の場合はキャンセル
		window.speechSynthesis.cancel();

		const utterance = new SpeechSynthesisUtterance(word);
		utterance.lang = options.lang || 'en-US';
		utterance.rate = options.rate || 0.9;

		utterance.onend = () => resolve();
		utterance.onerror = (event) => reject(new Error(`Speech error: ${event.error}`));

		window.speechSynthesis.speak(utterance);
	});
}

/**
 * 音声合成がサポートされているかチェック
 * @returns {boolean}
 */
export function isSpeechSupported() {
	return 'speechSynthesis' in window;
}

/**
 * 再生を停止
 */
export function stopSpeech() {
	if ('speechSynthesis' in window) {
		window.speechSynthesis.cancel();
	}
}
