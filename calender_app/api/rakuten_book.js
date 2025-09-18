export default async function handler(req, res) {
    const randomPage = Math.floor(Math.random() * 100) + 1;
    const appId = process.env.RAKUTEN_APP_ID; // 環境変数から読み込む

    const url = `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404`
        + `?format=json&booksGenreId=001004008&size=30&page=${randomPage}&applicationId=${appId}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({
            error: "楽天API取得エラー",
            detail: error.message
        });
    }
}
