export default async function handler(req, res) {
    const key = process.env.GOOGLE_API_KEY; // 環境変数から取得

    const url = `https://www.googleapis.com/calendar/v3/calendars/ja.japanese%23holiday%40group.v.calendar.google.com/events?key=${key}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Google API error: ${response.status}`);
        }
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({
            error: "祝日取得に失敗しました",
            detail: error.message,
        });
    }
}
