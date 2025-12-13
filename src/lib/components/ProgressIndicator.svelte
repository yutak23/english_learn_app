<script>
	/** @type {{ todayCount: number; totalCount: number; setProgress: { current: number; total: number } }} */
	let { todayCount, totalCount, setProgress } = $props();
</script>

<div class="progress-indicator">
	<div class="progress-stats">
		<div class="stat">
			<span class="stat-value">{todayCount}</span>
			<span class="stat-label">Today</span>
		</div>
		<div class="stat">
			<span class="stat-value">{totalCount}</span>
			<span class="stat-label">Total</span>
		</div>
	</div>

	<div class="set-progress">
		<div class="set-progress-bar">
			<div
				class="set-progress-fill"
				style="width: {setProgress.total > 0 ? (setProgress.current / setProgress.total) * 100 : 0}%"
			></div>
		</div>
		<span class="set-progress-text">{setProgress.current} / {setProgress.total}</span>
	</div>
</div>

<style>
	.progress-indicator {
		background: white;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
	}

	.progress-stats {
		display: flex;
		justify-content: space-around;
		margin-bottom: 1rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a1a2e;
	}

	.stat-label {
		font-size: 0.8rem;
		color: #666;
		text-transform: uppercase;
	}

	.set-progress {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.set-progress-bar {
		flex: 1;
		height: 8px;
		background: #e5e7eb;
		border-radius: 4px;
		overflow: hidden;
	}

	.set-progress-fill {
		height: 100%;
		background: #10b981;
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.set-progress-text {
		font-size: 0.9rem;
		font-weight: 600;
		color: #666;
		min-width: 50px;
		text-align: right;
	}
</style>
