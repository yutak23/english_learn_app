<script>
	/** @type {{ isActive: boolean; onStart: () => void; onStop: () => void }} */
	let { isActive, onStart, onStop } = $props();
</script>

<button
	class="session-control"
	class:active={isActive}
	onclick={() => isActive ? onStop() : onStart()}
>
	{#if isActive}
		<span class="icon">⏹</span>
		<span class="text">Stop Session</span>
	{:else}
		<span class="icon">▶</span>
		<span class="text">Start Session</span>
	{/if}
</button>

<style>
	.session-control {
		position: fixed;
		bottom: 20px;
		right: 20px;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border: none;
		border-radius: 50px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 100;
		background: #10b981;
		color: white;
	}

	.session-control:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
	}

	.session-control.active {
		background: #ef4444;
	}

	.icon {
		font-size: 1rem;
	}

	.text {
		white-space: nowrap;
	}
</style>
