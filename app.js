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

const reportHistory = document.getElementById("reportHistory");

// =======================
// Аналитика
// =======================

const analyticsPage = document.getElementById("analyticsPage");
const analyticsScreen = document.getElementById("analyticsScreen");

const salesCanvas = document.getElementById("salesChart");
const serviceCanvas = document.getElementById("serviceChart");
const paymentCanvas = document.getElementById("paymentChart");

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

    cashPage.classList.add("active");
    reportPage.classList.remove("active");

};

reportPage.onclick = () => {

    cashScreen.style.display = "none";
    reportScreen.style.display = "block";

    reportPage.classList.add("active");
    cashPage.classList.remove("active");

    const today = new Date();
    reportDate.value = today.toISOString().split("T")[0];

    loadReport(reportDate.value);

};
analyticsPage.onclick = () => {

    cashScreen.style.display = "none";
    reportScreen.style.display = "none";
    analyticsScreen.style.display = "block";

    cashPage.classList.remove("active");
    reportPage.classList.remove("active");
    analyticsPage.classList.add("active");

    drawCharts();

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

}
function drawCharts() {

    const days = {};

    sales.forEach(item => {

        if (!item.created?.toDate) return;

        const d = item.created.toDate();

        const day = d.toLocaleDateString("ru-RU");

        if (!days[day]) {

            days[day] = {
                total: 0,
                cars: 0,
                tubes: 0,
                kaspi: 0,
                cash: 0
            };

        }

        days[day].total += item.amount;

        if (item.service === "Машинки")
            days[day].cars += item.amount;

        if (item.service === "Тюбинг")
            days[day].tubes += item.amount;

        if (item.payment === "Kaspi")
            days[day].kaspi += item.amount;
        else
            days[day].cash += item.amount;

    });

    const labels = Object.keys(days);

    const totals = labels.map(d => days[d].total);

    const cars = labels.map(d => days[d].cars);

    const tubes = labels.map(d => days[d].tubes);

    const kaspi = labels.reduce((s,d)=>s+days[d].kaspi,0);

    const cash = labels.reduce((s,d)=>s+days[d].cash,0);


    if (salesChart) salesChart.destroy();
    if (serviceChart) serviceChart.destroy();
    if (paymentChart) paymentChart.destroy();


    salesChart = new Chart(salesCanvas, {

        type: "bar",

        data: {

            labels,

            datasets: [{
                label: "Выручка",
                data: totals
            }]

        }

    });


    serviceChart = new Chart(serviceCanvas, {

        type: "bar",

        data: {

            labels,

            datasets: [

                {
                    label: "🚗 Машинки",
                    data: cars
                },

                {
                    label: "🛷 Тюбинг",
                    data: tubes
                }

            ]

        }

    });


    paymentChart = new Chart(paymentCanvas, {

        type: "pie",

        data: {

            labels: ["Kaspi", "Наличные"],

            datasets: [{

                data: [kaspi, cash]

            }]

        }

    });

}