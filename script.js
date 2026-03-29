const STORAGE_KEY = "important-countdown-events";
const REMINDER_TICK_MS = 30000;

const state = {
    events: [],
    reminderTimer: null
};

const el = {
    solarDate: document.getElementById("solarDate"),
    weekdayText: document.getElementById("weekdayText"),
    lunarDate: document.getElementById("lunarDate"),
    clockText: document.getElementById("clockText"),
    featuredEvent: document.getElementById("featuredEvent"),
    emptyState: document.getElementById("emptyState"),
    featuredTag: document.getElementById("featuredTag"),
    featuredReminder: document.getElementById("featuredReminder"),
    featuredTitle: document.getElementById("featuredTitle"),
    featuredDesc: document.getElementById("featuredDesc"),
    featuredTarget: document.getElementById("featuredTarget"),
    featuredStatus: document.getElementById("featuredStatus"),
    daysValue: document.getElementById("daysValue"),
    hoursValue: document.getElementById("hoursValue"),
    minutesValue: document.getElementById("minutesValue"),
    eventList: document.getElementById("eventList"),
    eventForm: document.getElementById("eventForm"),
    titleInput: document.getElementById("titleInput"),
    descInput: document.getElementById("descInput"),
    dateInput: document.getElementById("dateInput"),
    timeInput: document.getElementById("timeInput"),
    categoryInput: document.getElementById("categoryInput"),
    reminderInput: document.getElementById("reminderInput"),
    notifyBtn: document.getElementById("notifyBtn"),
    template: document.getElementById("eventItemTemplate")
};

function loadEvents() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
        state.events = [];
        return;
    }

    try {
        state.events = JSON.parse(saved);
    } catch {
        state.events = [];
    }
}

function saveEvents() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.events));
}

function formatDateTime(date) {
    return new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(date);
}

function getLunarText(date) {
    const lunar = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
        year: "numeric",
        month: "long",
        day: "numeric"
    }).format(date);
    return `农历 ${lunar}`;
}

function updateClock() {
    const now = new Date();
    el.solarDate.textContent = new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric"
    }).format(now);
    el.weekdayText.textContent = new Intl.DateTimeFormat("zh-CN", {
        weekday: "long"
    }).format(now);
    el.clockText.textContent = now.toLocaleTimeString("zh-CN", { hour12: false });
    el.lunarDate.textContent = getLunarText(now);
}

function sortEvents() {
    state.events.sort((a, b) => new Date(a.targetAt) - new Date(b.targetAt));
}

function getTimeParts(targetAt) {
    const now = Date.now();
    const diff = new Date(targetAt).getTime() - now;

    if (diff <= 0) {
        return { expired: true, days: 0, hours: 0, minutes: 0, raw: diff };
    }

    const totalMinutes = Math.floor(diff / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    return { expired: false, days, hours, minutes, raw: diff };
}

function getReminderText(minutes) {
    if (!minutes) {
        return "不提醒";
    }
    if (minutes < 60) {
        return `提前 ${minutes} 分钟提醒`;
    }
    if (minutes < 1440) {
        return `提前 ${minutes / 60} 小时提醒`;
    }
    return `提前 ${minutes / 1440} 天提醒`;
}

function renderFeatured() {
    const upcoming = state.events.find(event => new Date(event.targetAt).getTime() > Date.now());
    if (!upcoming) {
        el.featuredEvent.classList.add("hidden");
        el.emptyState.classList.remove("hidden");
        return;
    }

    const parts = getTimeParts(upcoming.targetAt);
    el.emptyState.classList.add("hidden");
    el.featuredEvent.classList.remove("hidden");
    el.featuredTag.textContent = upcoming.category;
    el.featuredReminder.textContent = getReminderText(upcoming.reminderMinutes);
    el.featuredTitle.textContent = upcoming.title;
    el.featuredDesc.textContent = upcoming.description || "这是一件值得提前准备的重要事情。";
    el.daysValue.textContent = String(parts.days);
    el.hoursValue.textContent = String(parts.hours);
    el.minutesValue.textContent = String(parts.minutes);
    el.featuredTarget.textContent = `目标日期：${formatDateTime(new Date(upcoming.targetAt))}`;
    el.featuredStatus.textContent = parts.expired ? "状态：已到期" : `状态：剩余 ${parts.days} 天 ${parts.hours} 小时 ${parts.minutes} 分钟`;
}

function renderEventList() {
    el.eventList.innerHTML = "";

    if (!state.events.length) {
        el.eventList.innerHTML = '<div class="empty-state"><p>你还没有保存任何事件。</p></div>';
        return;
    }

    state.events.forEach(event => {
        const fragment = el.template.content.cloneNode(true);
        const item = fragment.querySelector(".event-item");
        const chip = fragment.querySelector(".event-chip");
        const count = fragment.querySelector(".event-count");
        const title = fragment.querySelector(".event-title");
        const description = fragment.querySelector(".event-description");
        const target = fragment.querySelector(".event-target");
        const reminder = fragment.querySelector(".event-reminder");
        const deleteBtn = fragment.querySelector(".delete-btn");

        const parts = getTimeParts(event.targetAt);
        chip.textContent = event.category;
        count.textContent = parts.expired
            ? "已到期"
            : `${parts.days} 天 ${parts.hours} 小时 ${parts.minutes} 分钟`;
        title.textContent = event.title;
        description.textContent = event.description || "未填写描述";
        target.textContent = formatDateTime(new Date(event.targetAt));
        reminder.textContent = getReminderText(event.reminderMinutes);

        deleteBtn.addEventListener("click", () => {
            state.events = state.events.filter(entry => entry.id !== event.id);
            saveEvents();
            renderAll();
        });

        if (parts.expired) {
            item.style.opacity = "0.68";
        }

        el.eventList.appendChild(fragment);
    });
}

function renderAll() {
    sortEvents();
    renderFeatured();
    renderEventList();
}

function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("当前浏览器不支持通知提醒。");
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            alert("提醒权限已开启。只要页面开着，就会按设定时间提醒你。\n若浏览器支持系统通知，也会尝试发送系统提醒。");
        }
    });
}

function maybeSendReminder(event) {
    if (!event.reminderMinutes) {
        return;
    }

    const now = Date.now();
    const target = new Date(event.targetAt).getTime();
    const reminderTime = target - event.reminderMinutes * 60000;

    if (now < reminderTime || now > target) {
        return;
    }

    const reminderKey = `reminded-${event.id}-${event.targetAt}`;
    if (localStorage.getItem(reminderKey)) {
        return;
    }

    localStorage.setItem(reminderKey, "1");
    if (Notification.permission === "granted") {
        new Notification("重要事件提醒", {
            body: `${event.title} 即将到来：${formatDateTime(new Date(event.targetAt))}`,
            tag: reminderKey
        });
    } else {
        alert(`提醒：${event.title} 即将到来\n时间：${formatDateTime(new Date(event.targetAt))}`);
    }
}

function checkReminders() {
    state.events.forEach(maybeSendReminder);
}

function seedDateDefaults() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
    el.dateInput.value = localDate;
}

function createEventFromForm(formData) {
    const targetAt = `${formData.date}T${formData.time || "09:00"}:00`;
    return {
        id: crypto.randomUUID(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        reminderMinutes: Number(formData.reminderMinutes),
        targetAt,
        createdAt: new Date().toISOString()
    };
}

el.eventForm.addEventListener("submit", event => {
    event.preventDefault();
    const nextEvent = createEventFromForm({
        title: el.titleInput.value,
        description: el.descInput.value,
        date: el.dateInput.value,
        time: el.timeInput.value,
        category: el.categoryInput.value,
        reminderMinutes: el.reminderInput.value
    });

    state.events.push(nextEvent);
    saveEvents();
    renderAll();
    el.eventForm.reset();
    seedDateDefaults();
    el.timeInput.value = "09:00";
    el.categoryInput.value = "学业";
    el.reminderInput.value = "0";
});

el.notifyBtn.addEventListener("click", requestNotificationPermission);

loadEvents();
seedDateDefaults();
updateClock();
renderAll();
checkReminders();

setInterval(() => {
    updateClock();
    renderAll();
}, 1000);

state.reminderTimer = setInterval(checkReminders, REMINDER_TICK_MS);
