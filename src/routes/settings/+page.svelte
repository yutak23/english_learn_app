<script>
	import { goto } from '$app/navigation';
	import {
		exportAllData,
		importAllData,
		clearAllData,
		getStorageUsage
	} from '$lib/storage/index.js';

	let storageUsage = $state({ used: 0, total: 0, percentage: 0 });
	let importError = $state('');
	let importSuccess = $state(false);

	$effect(() => {
		storageUsage = getStorageUsage();
	});

	function handleExport() {
		const data = exportAllData();
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `english-srs-backup-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	/**
	 * @param {Event} event
	 */
	function handleImport(event) {
		const input = /** @type {HTMLInputElement} */ (event.target);
		const file = input.files?.[0];
		if (!file) return;

		importError = '';
		importSuccess = false;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = JSON.parse(/** @type {string} */ (e.target?.result));
				importAllData(data);
				importSuccess = true;
				storageUsage = getStorageUsage();
			} catch (error) {
				importError = error instanceof Error ? error.message : 'Failed to import data';
			}
		};
		reader.readAsText(file);
	}

	function handleReset() {
		if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
			if (confirm('This will permanently delete all your learning progress. Continue?')) {
				clearAllData();
				storageUsage = getStorageUsage();
				alert('All data has been deleted.');
			}
		}
	}

	/**
	 * @param {number} bytes
	 */
	function formatBytes(bytes) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
	}
</script>

<svelte:head>
	<title>Settings - English SRS</title>
</svelte:head>

<div class="settings-page">
	<header class="header">
		<button class="back-button" onclick={() => goto('/')}> ← Back </button>
		<h1>Settings</h1>
	</header>

	<section class="section">
		<h2>Data Management</h2>

		<div class="storage-info">
			<span class="storage-label">Storage Used:</span>
			<span class="storage-value">
				{formatBytes(storageUsage.used)} / {formatBytes(storageUsage.total)}
				({storageUsage.percentage.toFixed(1)}%)
			</span>
			<div class="storage-bar">
				<div class="storage-fill" style="width: {storageUsage.percentage}%"></div>
			</div>
		</div>

		<div class="button-group">
			<button class="action-button" onclick={handleExport}> Export Data </button>

			<label class="action-button">
				Import Data
				<input type="file" accept=".json" onchange={handleImport} hidden />
			</label>

			<button class="action-button danger" onclick={handleReset}> Reset All Data </button>
		</div>

		{#if importError}
			<p class="error-message">{importError}</p>
		{/if}

		{#if importSuccess}
			<p class="success-message">Data imported successfully!</p>
		{/if}
	</section>

	<section class="section">
		<h2>About</h2>
		<div class="about-info">
			<p><strong>English SRS Learning App</strong></p>
			<p>Version 0.0.1</p>
			<p class="description">
				A spaced repetition system (SRS) app for learning English vocabulary, powered by the FSRS
				algorithm.
			</p>
		</div>
	</section>
</div>

<style>
	.settings-page {
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

	.section {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.section h2 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: #1a1a2e;
	}

	.storage-info {
		margin-bottom: 1rem;
	}

	.storage-label {
		font-size: 0.9rem;
		color: #666;
	}

	.storage-value {
		font-size: 0.9rem;
		color: #1a1a2e;
		font-weight: 600;
		margin-left: 0.5rem;
	}

	.storage-bar {
		margin-top: 0.5rem;
		height: 8px;
		background: #e5e7eb;
		border-radius: 4px;
		overflow: hidden;
	}

	.storage-fill {
		height: 100%;
		background: #10b981;
		border-radius: 4px;
		transition: width 0.3s;
	}

	.button-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.action-button {
		padding: 0.75rem 1rem;
		background: #f0f0f5;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		text-align: center;
		transition: background 0.2s;
	}

	.action-button:hover {
		background: #e0e0e8;
	}

	.action-button.danger {
		background: #fef2f2;
		color: #ef4444;
	}

	.action-button.danger:hover {
		background: #fee2e2;
	}

	.error-message {
		color: #ef4444;
		font-size: 0.9rem;
		margin-top: 1rem;
	}

	.success-message {
		color: #10b981;
		font-size: 0.9rem;
		margin-top: 1rem;
	}

	.about-info {
		color: #666;
		font-size: 0.9rem;
	}

	.about-info p {
		margin: 0.25rem 0;
	}

	.about-info .description {
		margin-top: 0.75rem;
		line-height: 1.5;
	}
</style>
