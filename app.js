import {
    db,
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "./firebase.js";

import {
    getToken,
    onMessage
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging.js";

import { messaging } from "./firebase.js";
async function initNotifications() {

    if (!("serviceWorker" in navigator)) return;

    try {

        await navigator.serviceWorker.register("./firebase-messaging-sw.js");

        const permission = await Notification.requestPermission();

        if (permission === "granted") {

            const token = await getToken(messaging, {
                vapidKey: "BJf5RHlotQmI5L2bqsPLSZ7ey-6MrPniSCUezp9qAmAPHcZogVjfJ49qn-k0jwVgxlgfcSjGqCoSpln3mE9HGy0"
            });

            console.log("FCM Token:", token);

        }

    } catch (e) {

        console.error("FCM Error:", e);

    }

}

initNotifications();
onMessage(messaging, (payload) => {

    console.log(payload);

    new Notification(
        payload.notification.title,
        {
            body: payload.notification.body
        }
    );

});
let payment = "Kaspi";

const kaspiBtn = document.getElementById("kaspiBtn");
const cashBtn = document.getElementById("cashBtn");
const undoBtn = document.getElementById("undoBtn");

const total = document.getElementById("total");
const kaspi = document.getElementById("kaspi");
const cash = document.getElementById("cash");
const cars = document.getElementById("cars");
const tubes = document.getElementById("tubes");
const carSalary = document.getElementById("carSalary");
const tubeSalary = document.getElementById("tubeSalary");
const totalSalary = document.getElementById("totalSalary");
const history = document.getElementById("history");

const salesRef = collection(db, "sales");

window.addSale = async function ({
    service,
    amount,
    payment
}) {

    await addDoc(salesRef, {

        service,
        amount,
        payment,
        created: serverTimestamp()

    });

};

// ==============================
// Меню
// ==============================

const cashPage = document.getElementById("cashPage");
const reportPage = document.getElementById("reportPage");

const cashScreen = document.getElementById("cashScreen");
const reportScreen = document.getElementById("reportScreen");

const reportDate = document.getElementById("reportDate");

const reportTotal = document.getElementById("reportTotal");
const reportKaspi = document.getElementById("reportKaspi");
const reportCash = document.getElementById("reportCash");
const reportCars = document.getElementById("reportCars");
const reportTubes = document.getElementById("reportTubes");
const reportCarSalary = document.getElementById("reportCarSalary");
const reportTubeSalary = document.getElementById("reportTubeSalary");
const reportTotalSalary = document.getElementById("reportTotalSalary");

const reportHistory = document.getElementById("reportHistory");

// =======================
// Аналитика
// =======================

const analyticsPage = document.getElementById("analyticsPage");
const analyticsScreen = document.getElementById("analyticsScreen");

const rentalPage = document.getElementById("rentalPage");
const rentalScreen = document.getElementById("rentalScreen");

const salesCanvas = document.getElementById("salesChart");
const serviceCanvas = document.getElementById("serviceChart");
const paymentCanvas = document.getElementById("paymentChart");

const analyticsDate = document.getElementById("analyticsDate");

analyticsDate.value =
    new Date().toISOString().split("T")[0];

analyticsDate.onchange = () => {

    drawCharts();

};

let salesChart;
let serviceChart;
let paymentChart;

let sales = [];

// ==============================
// Выбор способа оплаты
// ==============================

kaspiBtn.addEventListener("click", () => {

    payment = "Kaspi";

    kaspiBtn.classList.add("active");
    cashBtn.classList.remove("active");

});

cashBtn.addEventListener("click", () => {

    payment = "Наличные";

    cashBtn.classList.add("active");
    kaspiBtn.classList.remove("active");

});

// ==============================
// Добавление продажи
// ==============================

document.querySelectorAll(".price").forEach(button => {

    button.addEventListener("click", async () => {

        await addDoc(salesRef, {

            service: button.dataset.service,
            amount: Number(button.dataset.price),
            payment: payment,
            created: serverTimestamp()

        });

    });

});

// ==============================
// Получение данных
// ==============================

const q = query(
    salesRef,
    orderBy("created", "desc")
);

onSnapshot(q, snapshot => {

    sales = [];

    snapshot.forEach(docSnap => {

        sales.push({
            id: docSnap.id,
            ...docSnap.data()
        });

    });

    render();
    drawCharts();

});

// ==============================
// Основной рендер
// ==============================

function render() {

    const today = new Date();
    today.setHours(0,0,0,0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate()+1);

    let totalSum = 0;
    let kaspiSum = 0;
    let cashSum = 0;
    let carsSum = 0;
    let tubesSum = 0;

    const todaySales = sales.filter(item => {

        if(!item.created?.toDate) return false;

        const d = item.created.toDate();

        return d >= today && d < tomorrow;

    });

    todaySales.forEach(item => {

        totalSum += item.amount;

        if(item.payment === "Kaspi"){
            kaspiSum += item.amount;
        }else{
            cashSum += item.amount;
        }

        if(item.service === "Машинки"){
            carsSum += item.amount;
        }

        if(item.service === "Тюбинг"){
            tubesSum += item.amount;
        }

    });

    total.textContent = totalSum + " ₸";
    kaspi.textContent = kaspiSum + " ₸";
    cash.textContent = cashSum + " ₸";
    cars.textContent = carsSum + " ₸";
    tubes.textContent = tubesSum + " ₸";
    const carSalarySum = Math.round(carsSum * 0.20);
    const tubeSalarySum = Math.round(tubesSum * 0.15);

    const totalSalarySum = carSalarySum + tubeSalarySum;

totalSalary.textContent = totalSalarySum + " ₸";

    carSalary.textContent = carSalarySum + " ₸";
    tubeSalary.textContent = tubeSalarySum + " ₸";

    history.innerHTML = "";

    if(sales.length===0){

        history.innerHTML="Пока нет операций";

        return;

    }
    // ==============================
    // История операций
    // ==============================

    let currentGroup = "";

    sales.forEach(item => {

        const div = document.createElement("div");
        div.className = "history-item";

        let dateText = "";
        let timeText = "";
        let group = "Без даты";

        if (item.created?.toDate) {

            const d = item.created.toDate();

            dateText = d.toLocaleDateString("ru-RU");
            timeText = d.toLocaleTimeString("ru-RU");

            const itemDate = new Date(d);
            itemDate.setHours(0,0,0,0);

            const yesterday = new Date(today);
            yesterday.setDate(today.getDate()-1);

            if(itemDate.getTime() === today.getTime()){
                group = "📅 Сегодня";
            }
            else if(itemDate.getTime() === yesterday.getTime()){
                group = "📅 Вчера";
            }
            else{
                group = "📅 " + dateText;
            }

        }

        if(group !== currentGroup){

            currentGroup = group;

            const title = document.createElement("h3");
            title.className = "history-group";
            title.textContent = group;

            history.appendChild(title);

        }

        div.innerHTML = `
            <div class="history-top">

                <strong>${item.service}</strong>

                <strong>${item.amount} ₸</strong>

            </div>

            <div class="history-payment">

                ${item.payment === "Kaspi" ? "💳 Kaspi" : "💵 Наличные"}

            </div>

            <div class="history-time">

                🕒 ${timeText}

            </div>

            <br>

            <button
                class="delete"
                data-id="${item.id}">
                🗑 Удалить
            </button>
        `;

        history.appendChild(div);

    });

    document.querySelectorAll(".delete").forEach(btn => {

        btn.onclick = async () => {

            await deleteDoc(
                doc(db, "sales", btn.dataset.id)
            );

        };

    });

}
// ==============================
// Отмена последней операции
// ==============================

undoBtn.addEventListener("click", undoLastSale);

async function undoLastSale() {

    if (sales.length === 0) {
        alert("История пуста");
        return;
    }

    if (!confirm("Отменить последнюю операцию?")) {
        return;
    }

    try {

        await deleteDoc(
            doc(db, "sales", sales[0].id)
        );

    } catch (error) {

        console.error(error);

        alert(
            error.code +
            "\n\n" +
            error.message
        );

    }

}

// ==============================
// Очистка всей истории
// ==============================

window.clearAllSales = async function () {

    if (sales.length === 0) {
        alert("История уже пустая");
        return;
    }

    if (!confirm("Удалить всю историю?")) {
        return;
    }

    try {

        for (const sale of sales) {

            await deleteDoc(
                doc(db, "sales", sale.id)
            );

        }

        alert("История очищена");

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

};

// ==============================
// Автоматическое обновление
// статистики после полуночи
// ==============================

setInterval(() => {

    render();

}, 60000);

// ==============================
// Переключение страниц
// ==============================

cashPage.onclick = () => {

    cashScreen.style.display = "block";
    reportScreen.style.display = "none";
    analyticsScreen.style.display = "none";
    rentalScreen.style.display = "none";

    setActiveMenu(cashPage);

};

reportPage.onclick = () => {

    cashScreen.style.display = "none";
    reportScreen.style.display = "block";
    analyticsScreen.style.display = "none";
    rentalScreen.style.display = "none";

    setActiveMenu(reportPage);

    const today = new Date();
    reportDate.value = today.toISOString().split("T")[0];

    loadReport(reportDate.value);

};

analyticsPage.onclick = () => {

    cashScreen.style.display = "none";
    reportScreen.style.display = "none";
    analyticsScreen.style.display = "block";
    rentalScreen.style.display = "none";

    setActiveMenu(analyticsPage);

    drawCharts();

};
rentalPage.onclick = () => {

    cashScreen.style.display = "none";
    reportScreen.style.display = "none";
    analyticsScreen.style.display = "none";
    rentalScreen.style.display = "block";

    setActiveMenu(rentalPage);

};

reportDate.onchange = () => {

    loadReport(reportDate.value);

};
function loadReport(dateString){

    let total = 0;
    let kaspi = 0;
    let cash = 0;
    let cars = 0;
    let tubes = 0;

    reportHistory.innerHTML = "";

    const selected = new Date(dateString);
    selected.setHours(0,0,0,0);

    const next = new Date(selected);
    next.setDate(selected.getDate()+1);

    const daySales = sales.filter(item=>{

        if(!item.created?.toDate) return false;

        const d = item.created.toDate();

        return d>=selected && d<next;

    });

    if(daySales.length===0){

        reportHistory.innerHTML="Нет операций";

    }

    daySales.forEach(item=>{

        total += item.amount;

        if(item.payment==="Kaspi"){
            kaspi += item.amount;
        }else{
            cash += item.amount;
        }

        if(item.service==="Машинки"){
            cars += item.amount;
        }

        if(item.service==="Тюбинг"){
            tubes += item.amount;
        }

        const d=item.created.toDate();

        reportHistory.innerHTML += `
            <div class="history-item">

                <div class="history-top">

                    <strong>${item.service}</strong>

                    <strong>${item.amount} ₸</strong>

                </div>

                <div>${item.payment}</div>

                <div>
                    🕒 ${d.toLocaleTimeString("ru-RU")}
                </div>

            </div>
        `;

    });

    reportTotal.textContent = total + " ₸";
    reportKaspi.textContent = kaspi + " ₸";
    reportCash.textContent = cash + " ₸";
    reportCars.textContent = cars + " ₸";
    reportTubes.textContent = tubes + " ₸";
    const carSalary = Math.round(cars * 0.20);
    const tubeSalary = Math.round(tubes * 0.15);
    const totalSalary = carSalary + tubeSalary;

    reportCarSalary.textContent = carSalary + " ₸";
    reportTubeSalary.textContent = tubeSalary + " ₸";
    reportTotalSalary.textContent = totalSalary + " ₸";

}
function drawCharts() {

    const selected = new Date(analyticsDate.value);
    selected.setHours(0,0,0,0);

    const next = new Date(selected);
    next.setDate(selected.getDate()+1);

    let total = 0;
    let cars = 0;
    let tubes = 0;
    let kaspi = 0;
    let cash = 0;

    const hours = new Array(24).fill(0);

    sales.forEach(item => {

        if(!item.created?.toDate) return;

        const d = item.created.toDate();

        if(d < selected || d >= next) return;

        total += item.amount;

        if(item.service==="Тюбинг")
            tubes += item.amount;
        else
            cars += item.amount;

        if(item.payment==="Kaspi")
            kaspi += item.amount;
        else
            cash += item.amount;

        hours[d.getHours()] += item.amount;

    });

    if(salesChart) salesChart.destroy();
    if(serviceChart) serviceChart.destroy();
    if(paymentChart) paymentChart.destroy();

    salesChart = new Chart(salesCanvas,{

        type:"bar",

        data:{

            labels:[
                "0","1","2","3","4","5","6","7",
                "8","9","10","11","12","13","14","15",
                "16","17","18","19","20","21","22","23"
            ],

            datasets:[{

                label:"Выручка",

                data:hours

            }]

        }

    });

    serviceChart = new Chart(serviceCanvas,{

        type:"pie",

        data:{

            labels:["Машинки","Тюбинг"],

            datasets:[{

                data:[cars,tubes]

            }]

        }

    });

    paymentChart = new Chart(paymentCanvas,{

        type:"pie",

        data:{

            labels:["Kaspi","Наличные"],

            datasets:[{

                data:[kaspi,cash]

            }]

        }

    });

}
function setActiveMenu(button){

    [cashPage, reportPage, analyticsPage, rentalPage].forEach(btn => {

        btn.classList.remove("active");

    });

    button.classList.add("active");

}
if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("./sw.js")
            .then(() => {

                console.log("PWA готово");

            })
            .catch(console.error);

    });

}