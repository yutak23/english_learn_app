<script>
	import { speakWord, isSpeechSupported } from '../services/speech.js';

	/**
	 * @typedef {import('../stores/words.js').WordData} WordData
	 */

	/** @type {{ wordData: WordData; meaningVisible: boolean; onToggleMeaning: () => void }} */
	let { wordData, meaningVisible = false, onToggleMeaning } = $props();

	let isSpeaking = $state(false);

	async function handleSpeak() {
		if (isSpeaking) return;
		isSpeaking = true;
		try {
			await speakWord(wordData.word);
		} catch (error) {
			console.error('Speech error:', error);
		} finally {
			isSpeaking = false;
		}
	}

	const speechSupported = isSpeechSupported();
</script>

<div class="word-card">
	<!-- Word Header -->
	<div class="word-header">
		<h2 class="word-text">{wordData.word}</h2>
		{#if speechSupported}
			<button
				class="speak-button"
				onclick={handleSpeak}
				disabled={isSpeaking}
				aria-label="Speak word"
			>
				{#if isSpeaking}
					<span class="icon">🔊</span>
				{:else}
					<span class="icon">🔈</span>
				{/if}
			</button>
		{/if}
	</div>

	<!-- Pronunciation & Type -->
	<div class="word-meta">
		{#if wordData.pronunciation}
			<span class="pronunciation">{wordData.pronunciation}</span>
		{/if}
		{#if wordData.katakana}
			<span class="katakana">{wordData.katakana}</span>
		{/if}
		{#if wordData.type}
			<span class="type">{wordData.type}</span>
		{/if}
	</div>

	<!-- Meaning Toggle Area -->
	<button class="meaning-toggle" onclick={onToggleMeaning}>
		{#if meaningVisible}
			<div class="meaning-content">
				<p class="meaning">{wordData.meaning}</p>
				{#if wordData.contextMeaning}
					<p class="context-meaning">{wordData.contextMeaning}</p>
				{/if}
			</div>
		{:else}
			<p class="tap-hint">Tap to show meaning</p>
		{/if}
	</button>

	<!-- Example Sentence -->
	{#if wordData.example}
		<div class="example-section">
			<p class="example">{wordData.example}</p>
			{#if wordData.translation && meaningVisible}
				<p class="translation">{wordData.translation}</p>
			{/if}
		</div>
	{/if}

	<!-- Note -->
	{#if wordData.note && meaningVisible}
		<div class="note-section">
			<p class="note">{wordData.note}</p>
		</div>
	{/if}

	<!-- Derivatives -->
	{#if wordData.derivatives && wordData.derivatives.length > 0 && meaningVisible}
		<div class="derivatives-section">
			<h4>Derivatives</h4>
			{#each wordData.derivatives as derivative (derivative.word)}
				<div class="derivative">
					<span class="derivative-word">{derivative.word}</span>
					{#if derivative.type}
						<span class="derivative-type">({derivative.type})</span>
					{/if}
					{#if derivative.meaning}
						<span class="derivative-meaning">: {derivative.meaning}</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.word-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 1rem;
	}

	.word-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.word-text {
		font-size: 2rem;
		font-weight: 700;
		margin: 0;
		color: #1a1a2e;
	}

	.speak-button {
		background: #f0f0f5;
		border: none;
		border-radius: 50%;
		width: 48px;
		height: 48px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}

	.speak-button:hover:not(:disabled) {
		background: #e0e0e8;
	}

	.speak-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.icon {
		font-size: 1.5rem;
	}

	.word-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
		color: #666;
	}

	.pronunciation {
		font-family: monospace;
		font-size: 1rem;
	}

	.katakana {
		font-size: 0.9rem;
		color: #888;
	}

	.type {
		background: #e8e8f0;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8rem;
	}

	.meaning-toggle {
		width: 100%;
		background: #f8f8fc;
		border: 2px dashed #ddd;
		border-radius: 8px;
		padding: 1rem;
		cursor: pointer;
		text-align: left;
		transition: all 0.2s;
		min-height: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.meaning-toggle:hover {
		border-color: #aaa;
		background: #f0f0f8;
	}

	.tap-hint {
		color: #999;
		font-size: 1rem;
		margin: 0;
	}

	.meaning-content {
		width: 100%;
	}

	.meaning {
		font-size: 1.2rem;
		font-weight: 600;
		color: #1a1a2e;
		margin: 0 0 0.5rem 0;
	}

	.context-meaning {
		font-size: 0.9rem;
		color: #666;
		margin: 0;
	}

	.example-section {
		margin-top: 1rem;
		padding: 1rem;
		background: #fafafa;
		border-radius: 8px;
	}

	.example {
		font-size: 1rem;
		color: #333;
		margin: 0 0 0.5rem 0;
		line-height: 1.5;
	}

	.translation {
		font-size: 0.9rem;
		color: #666;
		margin: 0;
		padding-top: 0.5rem;
		border-top: 1px solid #eee;
	}

	.note-section {
		margin-top: 1rem;
		padding: 0.75rem;
		background: #fff8e6;
		border-radius: 8px;
		border-left: 3px solid #ffc107;
	}

	.note {
		font-size: 0.9rem;
		color: #666;
		margin: 0;
		line-height: 1.5;
	}

	.derivatives-section {
		margin-top: 1rem;
		padding: 1rem;
		background: #f0f8ff;
		border-radius: 8px;
	}

	.derivatives-section h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.9rem;
		color: #666;
	}

	.derivative {
		font-size: 0.9rem;
		margin-bottom: 0.25rem;
	}

	.derivative-word {
		font-weight: 600;
		color: #1a1a2e;
	}

	.derivative-type {
		color: #888;
		font-size: 0.8rem;
	}

	.derivative-meaning {
		color: #666;
	}
</style>
