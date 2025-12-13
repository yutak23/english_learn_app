<script>
	/**
	 * @typedef {'forgot' | 'remembered' | 'perfect'} Rating
	 */

	/** @type {{ onRate: (rating: Rating) => void; hidePerfect?: boolean; disabled?: boolean }} */
	let { onRate, hidePerfect = false, disabled = false } = $props();
</script>

<div class="rating-buttons">
	<button
		class="rating-button forgot"
		onclick={() => onRate('forgot')}
		{disabled}
	>
		Forgot
	</button>
	{#if !hidePerfect}
		<button
			class="rating-button perfect"
			onclick={() => onRate('perfect')}
			{disabled}
		>
			Perfect
		</button>
	{/if}
	<button
		class="rating-button remembered"
		onclick={() => onRate('remembered')}
		{disabled}
	>
		Remembered
	</button>
</div>

<style>
	.rating-buttons {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		padding: 1rem 0;
	}

	.rating-button {
		flex: 1;
		padding: 1rem 0.5rem;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		color: white;
		max-width: 120px;
	}

	.rating-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.rating-button.forgot {
		background: #ef4444;
	}

	.rating-button.forgot:hover:not(:disabled) {
		background: #dc2626;
	}

	.rating-button.perfect {
		background: #f97316;
	}

	.rating-button.perfect:hover:not(:disabled) {
		background: #ea580c;
	}

	.rating-button.remembered {
		background: #3b82f6;
	}

	.rating-button.remembered:hover:not(:disabled) {
		background: #2563eb;
	}
</style>
