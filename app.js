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

onSnapshot(salesRef, (snapshot) => {

    sales = [];

    snapshot.forEach(docSnap => {

        sales.push({
            id: docSnap.id,
            ...docSnap.data()
        });

    });

    render();

});
function render() {

    let totalSum = 0;
    let kaspiSum = 0;
    let cashSum = 0;
    let carsSum = 0;
    let tubesSum = 0;

    history.innerHTML = "";

    if (sales.length === 0) {
        history.innerHTML = "Пока нет операций";
    }

    sales.forEach(item => {

        totalSum += item.amount;

        if (item.payment === "Kaspi")
            kaspiSum += item.amount;
        else
            cashSum += item.amount;

        if (item.service === "Машинки")
            carsSum += item.amount;
        else
            tubesSum += item.amount;

        const div = document.createElement("div");
        div.className = "history-item";

        let time = "";

        if (item.created?.toDate) {
            time = item.created.toDate().toLocaleTimeString("ru-RU");
        }

        div.innerHTML = `
            <b>${time}</b><br>
            ${item.service}<br>
            ${item.payment}<br>
            <b>${item.amount} ₸</b>
            <br><br>
            <button class="delete" data-id="${item.id}">
                🗑 Удалить
            </button>
        `;

        history.appendChild(div);

    });

    total.textContent = totalSum + " ₸";
    kaspi.textContent = kaspiSum + " ₸";
    cash.textContent = cashSum + " ₸";
    cars.textContent = carsSum + " ₸";
    tubes.textContent = tubesSum + " ₸";

    document.querySelectorAll(".delete").forEach(btn => {

        btn.onclick = async () => {

            await deleteDoc(
                doc(db, "sales", btn.dataset.id)
            );

        };

    });

}// ==============================
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

        // Благодаря сортировке orderBy("created", "desc")
        // первая запись всегда самая последняя
        await deleteDoc(doc(db, "sales", sales[0].id));

    } catch (error) {

    console.error(error);

    alert(
        error.code + "\n\n" +
        error.message
    );

}

}

// ==============================
// Очистка истории (необязательно)
// ==============================

window.clearAllSales = async function () {

    if (sales.length === 0) return;

    if (!confirm("Удалить ВСЮ историю?")) return;

    for (const sale of sales) {
        await deleteDoc(doc(db, "sales", sale.id));
    }

};