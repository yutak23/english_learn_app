<script>
	import { onMount } from 'svelte';
	import { statsStore, loadStats } from '$lib/stores/stats.js';
	import { progressStore, loadProgress, learnedWordCount } from '$lib/stores/progress.js';
	import { logsStorage } from '$lib/storage/logs.js';

	let todayCount = $state(0);
	let todayTimeMin = $state(0);

	onMount(() => {
		loadStats();
		loadProgress();

		// Calculate today's stats
		const todayLogs = logsStorage.getTodayLogs();
		todayCount = todayLogs.length;
		const todayTimeSec = todayLogs.reduce((sum, log) => sum + log.timeSpentSec, 0);
		todayTimeMin = Math.round(todayTimeSec / 60);
	});
</script>

<svelte:head>
	<title>English SRS Learning App</title>
</svelte:head>

<div class="home-page">
	<header class="header">
		<h1>English SRS</h1>
		<p class="subtitle">Spaced Repetition Learning</p>
	</header>

	<section class="summary">
		<div class="stat-card">
			<span class="stat-value">{todayCount}</span>
			<span class="stat-label">Today</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{$learnedWordCount}</span>
			<span class="stat-label">Learned</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{todayTimeMin}</span>
			<span class="stat-label">Minutes</span>
		</div>
		<div class="stat-card streak">
			<span class="stat-value">{$statsStore.currentStreak}</span>
			<span class="stat-label">Streak</span>
		</div>
	</section>

	<nav class="navigation">
		<a href="/study" class="nav-button primary">
			<span class="nav-icon">📚</span>
			<span class="nav-text">Start Study</span>
		</a>
		<a href="/report" class="nav-button">
			<span class="nav-icon">📊</span>
			<span class="nav-text">View Report</span>
		</a>
		<a href="/settings" class="nav-button">
			<span class="nav-icon">⚙️</span>
			<span class="nav-text">Settings</span>
		</a>
	</nav>
</div>

<style>
	.home-page {
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem 1rem;
		min-height: 100vh;
		background: #f5f5f7;
	}

	.header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #1a1a2e;
		margin: 0;
	}

	.subtitle {
		color: #666;
		margin: 0.5rem 0 0 0;
		font-size: 1rem;
	}

	.summary {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.75rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		border-radius: 12px;
		padding: 1rem 0.5rem;
		text-align: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.stat-card.streak {
		background: linear-gradient(135deg, #fbbf24, #f59e0b);
	}

	.stat-card.streak .stat-value,
	.stat-card.streak .stat-label {
		color: white;
	}

	.stat-value {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a1a2e;
	}

	.stat-label {
		display: block;
		font-size: 0.75rem;
		color: #666;
		text-transform: uppercase;
		margin-top: 0.25rem;
	}

	.navigation {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.nav-button {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		background: white;
		border-radius: 12px;
		text-decoration: none;
		color: #1a1a2e;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		transition: all 0.2s;
	}

	.nav-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	}

	.nav-button.primary {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
	}

	.nav-icon {
		font-size: 1.5rem;
	}

	.nav-text {
		font-size: 1.1rem;
		font-weight: 600;
	}
</style>
