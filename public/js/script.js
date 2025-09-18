let currentYear, currentMonth;
let events = JSON.parse(localStorage.getItem("calendarEvents")) || {};
let tasks = JSON.parse(localStorage.getItem("taskEvents")) || {};
let holidays = {};

const calendarEl = document.getElementById("calendar");
const monthLabel = document.getElementById("monthLabel");
const scheduleListDiv = document.getElementById("scheduleList");
const taskListDiv = document.getElementById("taskList");

// 初期化
const setCalendar = () => {
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();

    loadHolidays().then(() => {
        renderCalendar();
    });
};

// 祝日取得
const loadHolidays = async () => {
    const res = await fetch("/api/holiday");
    const data = await res.json();
    if (data.items) {
        data.items.forEach(event => {
            holidays[event.start.date] = event.summary;
        });
    }
};

// カレンダー描画
const renderCalendar = () => {

    // カレンダー初期化
    calendarEl.innerHTML = "";
    monthLabel.textContent = `${currentYear}年 ${currentMonth + 1}月`;

    // 初日前の空白を作成
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        calendarEl.appendChild(document.createElement("div"));
    }


    // 取得した日付を文字列に変換するフォーマット
    const formatDateLocal = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };


    // カレンダーの日付を作成
    for (let d = 1; d <= daysInMonth; d++) {
        const today = new Date();
        const dateObj = new Date(currentYear, currentMonth, d);
        const dateStr = formatDateLocal(dateObj);

        const dayEl = document.createElement("div");
        dayEl.className = "day";
        dayEl.textContent = d;

        //今日の装飾クラス付与
        if (
            dateObj.getFullYear() === today.getFullYear() &&
            dateObj.getMonth() === today.getMonth() &&
            dateObj.getDate() === today.getDate()
        ) {
            dayEl.classList.add("today");
        }

        //祝日の装飾クラス付与
        if (holidays[dateStr]) {
            dayEl.classList.add("holiday");
            dayEl.title = holidays[dateStr];
        }

        //予定日の装飾クラス付与
        if (events[dateStr]) {
            dayEl.classList.add("event");
        }

        // 日付をクリックしてポップアップを表示
        dayEl.onclick = () => openPopup(dateStr);

        // カレンダーに作成した日付を追加
        calendarEl.appendChild(dayEl);
    }
};

// カレンダー月切替

// 次の月を表示
const nextMonth = () => {
    if (currentMonth + 1 === 12) {
        currentYear += 1;
        currentMonth = 0;
    } else {
        currentMonth += 1;
    }
    renderCalendar();
};

// 前の月を表示
const prevMonth = () => {
    if (currentMonth + 1 === 1) {
        currentYear -= 1;
        currentMonth = 11;
    } else {
        currentMonth -= 1;
    }
    renderCalendar();
};

// スケジュール入力ポップアップ

// ポップアップ表示
let selectedDate;
const openPopup = (dateStr) => {
    selectedDate = dateStr;
    popupDate.textContent = dateStr;
    eventInput.value = "";
    eventTime.value = "";
    popup.style.display = "block";
};

// ポップアップを閉じる
const closePopup = () => {
    popup.style.display = "none";
};

// 予定追加
const addEvent = () => {
    const time = eventTime.value;
    const text = eventInput.value.trim();
    if (!text) return alert("予定を入力してください");

    events[selectedDate] ||= [];
    events[selectedDate].push({ time, text });

    events[selectedDate].sort((a, b) => a.time.localeCompare(b.time));

    localStorage.setItem("calendarEvents", JSON.stringify(events));
    closePopup();
    renderCalendar();
    renderScheduleList();
};

// スケジュール一覧
const renderScheduleList = () => {

    // スケジュール一覧を初期化
    scheduleListDiv.innerHTML = "";

    // 今日の年月日を取得
    const getTodayStr = () => {
        const now = new Date();
        return (
            now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, "0") + "-" +
            String(now.getDate()).padStart(2, "0")
        );
    };

    const todayStr = getTodayStr();

    // 全ての予定の日付を日付順にソート
    const dates = Object.keys(events).sort((a, b) => a.localeCompare(b));

    if (dates.length === 0) {
        scheduleListDiv.innerHTML = "<p>予定はありません</p>";
        return;
    }

    let scrollTarget = null;

    dates.forEach(date => {
        const div = document.createElement("div");
        div.innerHTML = `<strong>${date}</strong>`;
        const ul = document.createElement("ul");

        events[date].forEach((e, index) => {
            const li = document.createElement("li");

            const leftDiv = document.createElement("div");
            leftDiv.className = "leftDiv";
            leftDiv.textContent = `${e.text}`;

            const rightDiv = document.createElement("div");
            rightDiv.className = "rightDiv";

            const timeSpan = document.createElement("span");
            timeSpan.textContent = `${e.time}`;

            const btn = document.createElement("button");
            btn.textContent = "削除";
            btn.onclick = () => {
                deleteScheduleEvent(date, index);
            };

            rightDiv.appendChild(timeSpan);
            rightDiv.appendChild(btn);

            li.appendChild(leftDiv);
            li.appendChild(rightDiv);
            ul.appendChild(li);
        });

        div.appendChild(ul);
        scheduleListDiv.appendChild(div);

        // 今日以降で最も近い日付をスクロール対象に
        if (!scrollTarget && date >= todayStr) scrollTarget = div;
    });

    // 今日以降の予定がない場合は一番最後の予定にスクロール
    if (!scrollTarget) scrollTarget = scheduleListDiv.lastChild;

    if (scrollTarget) {
        scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });
    }
};

// 予定を削除
const deleteScheduleEvent = (date, index) => {
    events[date].splice(index, 1);
    if (events[date].length === 0) delete events[date];
    localStorage.setItem("calendarEvents", JSON.stringify(events));
    renderCalendar();
    renderScheduleList();
};

const taskeventInput = document.getElementById("taskeventInput");

// タスク一覧を描画
const renderTaskList = () => {
    taskListDiv.innerHTML = "";

    const ul = document.createElement("ul");

    if (tasks[selectedDate]) {
        tasks[selectedDate].forEach((t, index) => {
            const li = document.createElement("li");

            // 左側（チェックボックス＋テキスト）
            const leftDiv = document.createElement("div");
            leftDiv.className = "leftDiv";

            const chk = document.createElement("input");
            chk.type = "checkbox";
            chk.checked = t.done || false;

            const span = document.createElement("span");
            span.textContent = t.text;
            if (t.done) span.style.textDecoration = "line-through";

            // チェックを切り替えたら保存
            chk.addEventListener("change", () => {
                t.done = chk.checked;
                localStorage.setItem("tasks", JSON.stringify(tasks));
                renderTaskList();
            });

            leftDiv.appendChild(chk);
            leftDiv.appendChild(span);

            // 右側（削除ボタン）
            const rightDiv = document.createElement("div");
            rightDiv.className = "rightDiv";

            const btn = document.createElement("button");
            btn.textContent = "削除";
            btn.onclick = () => deleteTask(selectedDate, index);

            rightDiv.appendChild(btn);

            li.appendChild(leftDiv);
            li.appendChild(rightDiv);
            ul.appendChild(li);
        });
    }

    taskListDiv.appendChild(ul);
};

// タスク追加
const addTask = () => {
    const text = taskeventInput.value.trim();
    if (!text) return alert("タスクを入力してください");

    tasks[selectedDate] ||= [];
    tasks[selectedDate].push({ text, done: false }); // ✅ doneを初期化

    localStorage.setItem("taskEvents", JSON.stringify(tasks));
    taskeventInput.value = "";
    renderTaskList();
};

// タスク削除
const deleteTask = (date, index) => {
    tasks[date].splice(index, 1);
    if (tasks[date].length === 0) delete tasks[date];
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTaskList();
};

// おすすめ小説コーナー

// 表示先の要素
const imageDiv = document.querySelector(".book-image");
const titleDiv = document.querySelector(".book-title");
const authorDiv = document.querySelector(".book-author");
const captionDiv = document.querySelector(".book-caption");

// ランダム小説取得
const loadRandomBook = async () => {
    const imageDiv = document.querySelector(".book-image img");
    const titleDiv = document.querySelector(".book-title");
    const authorDiv = document.querySelector(".book-author");
    const captionDiv = document.querySelector(".book-caption");

    try {
        const res = await fetch("/api/rakuten_book");
        const data = await res.json();

        const randomIndex = Math.floor(Math.random() * data.Items.length);
        const book = data.Items[randomIndex].Item;

        // 情報を反映
        imageDiv.src = book.smallImageUrl || "/img/noimage";
        imageDiv.alt = book.title;
        titleDiv.textContent = book.title;
        authorDiv.textContent = book.author;
        captionDiv.textContent = book.itemCaption || "紹介文はありません";

    } catch (err) {
        // API取得失敗時の表示
        imageDiv.src = "/img/noimage";
        imageDiv.alt = "";
        titleDiv.textContent = "";
        authorDiv.textContent = "";
        captionDiv.textContent = "読み込みに失敗しました。";
    }
};














document.addEventListener("DOMContentLoaded", () => {
    setCalendar();
    loadHolidays();
    renderCalendar();
    renderScheduleList();
    renderTaskList();
    loadRandomBook();
});