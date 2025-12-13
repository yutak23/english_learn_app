<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import WordCard from '$lib/components/WordCard.svelte';
	import RatingButtons from '$lib/components/RatingButtons.svelte';
	import ProgressIndicator from '$lib/components/ProgressIndicator.svelte';
	import SessionControl from '$lib/components/SessionControl.svelte';
	import { wordsStore, wordsMap, loadWords } from '$lib/stores/words.js';
	import {
		progressStore,
		loadProgress,
		updateProgress,
		getProgress
	} from '$lib/stores/progress.js';
	import {
		sessionStore,
		startSession,
		endSession,
		incrementStudyCount
	} from '$lib/stores/session.js';
	import { statsStore, loadStats, updateStreak, incrementTotalStudies } from '$lib/stores/stats.js';
	import { scheduler } from '$lib/services/scheduler.js';
	import { studyQueue } from '$lib/services/studyQueue.js';
	import { logsStorage } from '$lib/storage/logs.js';

	/**
	 * @typedef {import('$lib/services/studyQueue.js').StudySet} StudySet
	 * @typedef {import('$lib/stores/words.js').WordData} WordData
	 * @typedef {import('$lib/storage/logs.js').Rating} Rating
	 */

	/** @type {StudySet | null} */
	let currentSet = $state(null);
	/** @type {string | null} */
	let currentWord = $state(null);
	/** @type {WordData | null} */
	let currentWordData = $state(null);
	let meaningVisible = $state(false);
	let shownAt = $state(0);
	let todayCount = $state(0);

	// Derived values
	let isSessionActive = $derived($sessionStore.isActive);
        let wordsLoaded = $derived($wordsStore.words.length > 0);
        let wordsLoading = $derived($wordsStore.loading);
        let wordsError = $derived($wordsStore.error);
        let canStartSession = $derived(wordsLoaded && !wordsLoading && !wordsError);
        let setProgress = $derived(
                currentSet ? studyQueue.getSetProgress(currentSet) : { current: 0, total: 0 }
        );
	let hidePerfect = $derived(
		currentSet && currentWord ? studyQueue.hasForgotten(currentSet, currentWord) : false
	);
	let totalStudied = $derived($statsStore.totalStudies);

        onMount(async () => {
                // Load data from localStorage
                loadProgress();
                loadStats();

		// Load words
		await loadWords({ wordFiles: ['/data/basic.json'] });

		// Count today's studies
		const todayLogs = logsStorage.getTodayLogs();
		todayCount = todayLogs.length;
        });

        function handleStartSession() {
                if (!canStartSession) {
                        alert('Words are not ready yet. Please wait for them to load or check settings.');
                        return;
                }

                startSession();
                startNewSet();
        }

	function handleStopSession() {
		if (confirm('Are you sure you want to stop the session?')) {
			endSession();
			currentSet = null;
			currentWord = null;
			currentWordData = null;
		}
	}

	function startNewSet() {
		if ($wordsStore.words.length === 0) return;

		currentSet = studyQueue.createSet($wordsStore.words, $progressStore);
		showNextWord();
	}

	function showNextWord() {
		if (!currentSet) return;

		const nextWord = studyQueue.getNextWord(currentSet);
		if (nextWord) {
			currentWord = nextWord;
			currentWordData = $wordsMap.get(nextWord) || null;
			meaningVisible = false;
			shownAt = Date.now();
		} else {
			// Set complete, start new set
			startNewSet();
		}
	}

	/**
	 * @param {Rating} rating
	 */
	function handleRate(rating) {
		if (!currentWord || !currentSet) return;

		const timeSpentSec = Math.floor((Date.now() - shownAt) / 1000);
		const existingProgress = getProgress(currentWord);
		const currentState = existingProgress?.state || 'New';

		// Update FSRS schedule
		const newProgress = scheduler.schedule(currentWord, existingProgress, rating, timeSpentSec);
		updateProgress(currentWord, newProgress);

		// Record log
		logsStorage.add({
			word: currentWord,
			timestamp: Date.now(),
			rating,
			timeSpentSec,
			state: currentState
		});

		// Update stats
		incrementTotalStudies();
		updateStreak();
		incrementStudyCount();
		todayCount++;

		// Update set
		currentSet = studyQueue.recordAnswer(currentSet, currentWord, rating);

		// Show next word
		showNextWord();
	}

	function toggleMeaning() {
		meaningVisible = !meaningVisible;
	}

	function goBack() {
		if (isSessionActive) {
			if (confirm('You have an active session. Are you sure you want to leave?')) {
				endSession();
				goto('/');
			}
		} else {
			goto('/');
		}
	}
</script>

<svelte:head>
	<title>Study - English Learn App</title>
</svelte:head>

<div class="study-page">
	<header class="header">
		<button class="back-button" onclick={goBack}> ← Back </button>
		<h1>Study</h1>
	</header>

	{#if wordsLoading}
		<div class="loading">
			<p>Loading words...</p>
		</div>
	{:else if wordsError}
		<div class="error">
			<p>Error: {wordsError}</p>
			<button onclick={() => goto('/')}>Go Back</button>
		</div>
	{:else if !wordsLoaded}
		<div class="no-words">
			<p>No words available.</p>
			<button onclick={() => goto('/settings')}>Configure Word Files</button>
		</div>
	{:else if !isSessionActive}
		<div class="session-start">
			<p>Start a session to begin studying.</p>
			<ProgressIndicator
				{todayCount}
				totalCount={totalStudied}
				setProgress={{ current: 0, total: 5 }}
			/>
		</div>
	{:else if currentWordData}
		<ProgressIndicator {todayCount} totalCount={totalStudied} {setProgress} />

		<WordCard wordData={currentWordData} {meaningVisible} onToggleMeaning={toggleMeaning} />

		<RatingButtons onRate={handleRate} {hidePerfect} disabled={!meaningVisible} />
	{:else}
		<div class="loading">
			<p>Preparing next word...</p>
		</div>
	{/if}

        <SessionControl
                isActive={isSessionActive}
                onStart={handleStartSession}
                onStop={handleStopSession}
                disabled={!isSessionActive && !canStartSession}
        />
</div>

<style>
	.study-page {
		max-width: 600px;
		margin: 0 auto;
		padding: 1rem;
		padding-bottom: 100px;
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

	.loading,
	.error,
	.no-words,
	.session-start {
		text-align: center;
		padding: 2rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.error {
		color: #ef4444;
	}

	.error button,
	.no-words button {
		margin-top: 1rem;
		padding: 0.75rem 1.5rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
	}

	.session-start p {
		color: #666;
		margin-bottom: 1.5rem;
	}
</style>
