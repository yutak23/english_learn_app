/**
 * JST（日本標準時）の現在時刻を取得
 * @returns {Date} JST の Date オブジェクト
 */
export function getJSTDate() {
	const now = new Date();
	// UTC時刻を取得し、JSTオフセット（+9時間）を加算
	const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
	return new Date(utc + 9 * 60 * 60 * 1000);
}

/**
 * 今日の日付を取得（JST）
 * @returns {string} YYYY-MM-DD 形式
 */
export function getTodayDateString() {
	const jstDate = getJSTDate();
	const year = jstDate.getFullYear();
	const month = String(jstDate.getMonth() + 1).padStart(2, '0');
	const day = String(jstDate.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * 昨日の日付を取得（JST）
 * @returns {string} YYYY-MM-DD 形式
 */
export function getYesterdayDateString() {
	const jstDate = getJSTDate();
	jstDate.setDate(jstDate.getDate() - 1);
	const year = jstDate.getFullYear();
	const month = String(jstDate.getMonth() + 1).padStart(2, '0');
	const day = String(jstDate.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * 今日の開始時刻を取得（JST 00:00:00 を UTC タイムスタンプで）
 * @returns {number} タイムスタンプ（ミリ秒）
 */
export function getTodayStartTimestamp() {
	const jstDate = getJSTDate();
	jstDate.setHours(0, 0, 0, 0);
	// JSTの0時をUTCタイムスタンプに変換（-9時間）
	return jstDate.getTime() - 9 * 60 * 60 * 1000;
}

/**
 * 今日の終了時刻を取得（JST 23:59:59.999 を UTC タイムスタンプで）
 * @returns {number} タイムスタンプ（ミリ秒）
 */
export function getTodayEndTimestamp() {
	const jstDate = getJSTDate();
	jstDate.setHours(23, 59, 59, 999);
	// JSTの23:59をUTCタイムスタンプに変換（-9時間）
	return jstDate.getTime() - 9 * 60 * 60 * 1000;
}
