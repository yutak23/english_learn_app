<script>
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Report - English SRS</title>
</svelte:head>

<div class="report-page">
	<header class="header">
		<button class="back-button" onclick={() => goto('/')}> ← Back </button>
		<h1>Report</h1>
	</header>

	<div class="placeholder">
		<p>Report feature coming soon...</p>
		<p class="hint">This will include:</p>
		<ul>
			<li>Daily Studies chart</li>
			<li>Word Status overview</li>
			<li>Weak Words list</li>
			<li>Study Time statistics</li>
		</ul>
	</div>
</div>

<style>
	.report-page {
		max-width: 600px;
		margin: 0 auto;
		padding: 1rem;
		min-height: 100vh;
		background: #f5f5f7;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.header h1 {
		margin: 0;
		font-size: 1.5rem;
		color: #1a1a2e;
	}

	.back-button {
		background: none;
		border: none;
		font-size: 1rem;
		color: #3b82f6;
		cursor: pointer;
		padding: 0.5rem;
	}

	.back-button:hover {
		text-decoration: underline;
	}

	.placeholder {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.placeholder p {
		color: #666;
		margin: 0 0 1rem 0;
	}

	.placeholder .hint {
		font-weight: 600;
		color: #1a1a2e;
	}

	.placeholder ul {
		text-align: left;
		color: #666;
		margin: 0;
		padding-left: 1.5rem;
	}

	.placeholder li {
		margin-bottom: 0.5rem;
	}
</style>
