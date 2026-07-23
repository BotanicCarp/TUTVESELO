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
const history = document.getElementById("history");

const salesRef = collection(db, "sales");

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