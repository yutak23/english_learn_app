import { DateTime } from 'luxon';

const JST_ZONE = 'Asia/Tokyo';

/**
 * JST（日本標準時）の現在時刻を取得
 * @returns {DateTime} luxon DateTime オブジェクト（JST）
 */
export function getJSTNow() {
	return DateTime.now().setZone(JST_ZONE);
}

/**
 * 今日の日付を取得（JST）
 * @returns {string} YYYY-MM-DD 形式
 */
export function getTodayDateString() {
	return getJSTNow().toFormat('yyyy-MM-dd');
}

/**
 * 昨日の日付を取得（JST）
 * @returns {string} YYYY-MM-DD 形式
 */
export function getYesterdayDateString() {
	return getJSTNow().minus({ days: 1 }).toFormat('yyyy-MM-dd');
}

/**
 * 今日の開始時刻を取得（JST 00:00:00 を UTC タイムスタンプで）
 * @returns {number} タイムスタンプ（ミリ秒）
 */
export function getTodayStartTimestamp() {
	const startOfDay = getJSTNow().startOf('day');
	return startOfDay.toMillis();
}

/**
 * 今日の終了時刻を取得（JST 23:59:59.999 を UTC タイムスタンプで）
 * @returns {number} タイムスタンプ（ミリ秒）
 */
export function getTodayEndTimestamp() {
	// 翌日の開始時刻から1ミリ秒引く
	const tomorrowStart = getJSTNow().plus({ days: 1 }).startOf('day');
	return tomorrowStart.toMillis() - 1;
}
