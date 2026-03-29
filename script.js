const STORAGE_KEY = "important-countdown-events";
const REMINDER_TICK_MS = 30000;

const state = {
    events: [],
    currentView: "day",
    reminderTimer: null,
    installPrompt: null
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
    calendarList: document.getElementById("calendarList"),
    calendarSummary: document.getElementById("calendarSummary"),
    eventForm: document.getElementById("eventForm"),
    editIdInput: document.getElementById("editIdInput"),
    titleInput: document.getElementById("titleInput"),
    descInput: document.getElementById("descInput"),
    dateInput: document.getElementById("dateInput"),
    timeInput: document.getElementById("timeInput"),
    categoryInput: document.getElementById("categoryInput"),
    colorInput: document.getElementById("colorInput"),
    reminderInput: document.getElementById("reminderInput"),
    completedInput: document.getElementById("completedInput"),
    notifyBtn: document.getElementById("notifyBtn"),
    submitBtn: document.getElementById("submitBtn"),
    cancelEditBtn: document.getElementById("cancelEditBtn"),
    installFab: document.getElementById("installFab"),
    template: document.getElementById("eventItemTemplate"),
    viewButtons: Array.from(document.querySelectorAll("[data-view]"))
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

function formatDate(date) {
    return new Intl.DateTimeFormat("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "long"
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
    el.weekdayText.textContent = new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(now);
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
    return {
        expired: false,
        days: Math.floor(totalMinutes / (60 * 24)),
        hours: Math.floor((totalMinutes % (60 * 24)) / 60),
        minutes: totalMinutes % 60,
        raw: diff
    };
}

function getReminderText(minutes) {
    if (!minutes) return "不提醒";
    if (minutes < 60) return `提前 ${minutes} 分钟提醒`;
    if (minutes < 1440) return `提前 ${minutes / 60} 小时提醒`;
    return `提前 ${minutes / 1440} 天提醒`;
}

function applyTagClass(node, color) {
    node.className = `event-chip tag-${color || "green"}`;
}

function renderFeatured() {
    const upcoming = state.events.find(event => !event.completed && new Date(event.targetAt).getTime() > Date.now());
    if (!upcoming) {
        el.featuredEvent.classList.add("hidden");
        el.emptyState.classList.remove("hidden");
        return;
    }

    const parts = getTimeParts(upcoming.targetAt);
    el.emptyState.classList.add("hidden");
    el.featuredEvent.classList.remove("hidden");
    el.featuredTag.textContent = upcoming.category;
    el.featuredTag.className = `event-tag event-chip tag-${upcoming.color || "green"}`;
    el.featuredReminder.textContent = getReminderText(upcoming.reminderMinutes);
    el.featuredTitle.textContent = upcoming.title;
    el.featuredDesc.textContent = upcoming.description || "这是一件值得提前准备的重要事情。";
    el.daysValue.textContent = String(parts.days);
    el.hoursValue.textContent = String(parts.hours);
    el.minutesValue.textContent = String(parts.minutes);
    el.featuredTarget.textContent = `目标日期：${formatDateTime(new Date(upcoming.targetAt))}`;
    el.featuredStatus.textContent = `状态：剩余 ${parts.days} 天 ${parts.hours} 小时 ${parts.minutes} 分钟`;
}

function startOfDay(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function endOfDay(date) {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
}

function getCalendarEvents() {
    const now = new Date();
    const dayStart = startOfDay(now).getTime();
    const dayEnd = endOfDay(now).getTime();
    const weekEnd = endOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6)).getTime();

    return state.events.filter(event => {
        const target = new Date(event.targetAt).getTime();
        if (state.currentView === "day") {
            return target >= dayStart && target <= dayEnd;
        }
        return target >= dayStart && target <= weekEnd;
    });
}

function renderCalendar() {
    const items = getCalendarEvents();
    el.calendarList.innerHTML = "";

    el.viewButtons.forEach(button => {
        button.classList.toggle("active-view", button.dataset.view === state.currentView);
    });

    el.calendarSummary.textContent = state.currentView === "day"
        ? "只显示今天要发生的事件。"
        : "显示从今天开始 7 天内的事件。";

    if (!items.length) {
        el.calendarList.innerHTML = '<div class="empty-state"><p>这个视图中还没有事件。</p></div>';
        return;
    }

    items.forEach(event => {
        const card = document.createElement("article");
        card.className = "calendar-card";
        card.innerHTML = `
            <p class="event-chip tag-${event.color || "green"}">${event.category}</p>
            <h3>${event.title}</h3>
            <p>${formatDate(new Date(event.targetAt))}</p>
            <p>${formatDateTime(new Date(event.targetAt))}</p>
            <p>${event.completed ? "已完成" : getReminderText(event.reminderMinutes)}</p>
        `;
        el.calendarList.appendChild(card);
    });
}

function resetForm() {
    el.eventForm.reset();
    el.editIdInput.value = "";
    el.submitBtn.textContent = "保存事件";
    el.cancelEditBtn.classList.add("hidden");
    seedDateDefaults();
    el.timeInput.value = "09:00";
    el.categoryInput.value = "学业";
    el.colorInput.value = "green";
    el.reminderInput.value = "0";
    el.completedInput.value = "false";
}

function populateForm(event) {
    el.editIdInput.value = event.id;
    el.titleInput.value = event.title;
    el.descInput.value = event.description || "";
    el.dateInput.value = event.targetAt.slice(0, 10);
    el.timeInput.value = event.targetAt.slice(11, 16);
    el.categoryInput.value = event.category;
    el.colorInput.value = event.color || "green";
    el.reminderInput.value = String(event.reminderMinutes);
    el.completedInput.value = String(Boolean(event.completed));
    el.submitBtn.textContent = "保存修改";
    el.cancelEditBtn.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        const eventState = fragment.querySelector(".event-state");
        const completeBtn = fragment.querySelector(".complete-btn");
        const editBtn = fragment.querySelector(".edit-btn");
        const deleteBtn = fragment.querySelector(".delete-btn");

        const parts = getTimeParts(event.targetAt);
        applyTagClass(chip, event.color);
        chip.textContent = event.category;
        count.textContent = event.completed
            ? "已完成"
            : parts.expired
                ? "已到期"
                : `${parts.days} 天 ${parts.hours} 小时 ${parts.minutes} 分钟`;
        title.textContent = event.title;
        description.textContent = event.description || "未填写描述";
        target.textContent = formatDateTime(new Date(event.targetAt));
        reminder.textContent = getReminderText(event.reminderMinutes);
        eventState.textContent = event.completed ? "状态：已完成" : "状态：进行中";
        completeBtn.textContent = event.completed ? "取消完成" : "完成";

        if (event.completed || parts.expired) {
            item.classList.add("done");
        }

        completeBtn.addEventListener("click", () => {
            event.completed = !event.completed;
            saveEvents();
            renderAll();
        });

        editBtn.addEventListener("click", () => populateForm(event));

        deleteBtn.addEventListener("click", () => {
            state.events = state.events.filter(entry => entry.id !== event.id);
            saveEvents();
            if (el.editIdInput.value === event.id) {
                resetForm();
            }
            renderAll();
        });

        el.eventList.appendChild(fragment);
    });
}

function renderAll() {
    sortEvents();
    renderFeatured();
    renderCalendar();
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
    if (!event.reminderMinutes || event.completed) return;

    const now = Date.now();
    const target = new Date(event.targetAt).getTime();
    const reminderTime = target - event.reminderMinutes * 60000;
    if (now < reminderTime || now > target) return;

    const reminderKey = `reminded-${event.id}-${event.targetAt}`;
    if (localStorage.getItem(reminderKey)) return;

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

function buildEventFromForm() {
    return {
        id: el.editIdInput.value || crypto.randomUUID(),
        title: el.titleInput.value.trim(),
        description: el.descInput.value.trim(),
        category: el.categoryInput.value,
        color: el.colorInput.value,
        reminderMinutes: Number(el.reminderInput.value),
        completed: el.completedInput.value === "true",
        targetAt: `${el.dateInput.value}T${el.timeInput.value || "09:00"}:00`,
        createdAt: new Date().toISOString()
    };
}

el.eventForm.addEventListener("submit", event => {
    event.preventDefault();
    const payload = buildEventFromForm();
    const index = state.events.findIndex(entry => entry.id === payload.id);
    if (index >= 0) {
        payload.createdAt = state.events[index].createdAt;
        state.events[index] = payload;
    } else {
        state.events.push(payload);
    }

    saveEvents();
    resetForm();
    renderAll();
});

el.cancelEditBtn.addEventListener("click", resetForm);
el.notifyBtn.addEventListener("click", requestNotificationPermission);
el.viewButtons.forEach(button => {
    button.addEventListener("click", () => {
        state.currentView = button.dataset.view;
        renderCalendar();
    });
});

window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    state.installPrompt = event;
});

el.installFab.addEventListener("click", async () => {
    if (state.installPrompt) {
        state.installPrompt.prompt();
        await state.installPrompt.userChoice;
        state.installPrompt = null;
        return;
    }

    alert("当前浏览器没有提供自动安装弹窗。\n你可以使用浏览器菜单里的“安装应用”或“安装此站点为应用”来手动安装。");
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js");
    });
}

loadEvents();
resetForm();
updateClock();
renderAll();
checkReminders();

setInterval(() => {
    updateClock();
    renderAll();
}, 1000);

state.reminderTimer = setInterval(checkReminders, REMINDER_TICK_MS);
