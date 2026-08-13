import {
    db,
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp
} from "./firebase.js";

const rentalConfig = {

    cars: {
        times: [10,20,30,60],
        items: {
            "Квадрик": 2000,
            "Ф1": 2000,
            "Бентли": 1500,
            "Трактор": 1500,
            "Мерседес": 1500,
            "Гелик": 1500
        }
    },

    scooters: {
        times: [30,60],
        price: 1000,
        items: [
            "Самокат ",
        ]
    },

    miniCars: {
        times: [30,60],
        price: 2000,
        items: [
            "Мини машина 1",
            "Мини машина 2",
            "Мини машина 3"
        ]
    },

    miniScooters: {
        times: [30,60],
        price: 500,
        items: [
            "Мини самокат ",
        ]
    },

trampolines: {
    times: [15,30],
    price: 1000,
    items: [
        "Батут левый",
        "Батут правый"
    ]
},

    tubes: {
        times: [60],
        price: 1000,
        items: [
            "Тюбинг ",
        ]
    }

};
let currentRental = null;

const activeRentals = {};

let isStartingRent = false;

const rentalsRef = collection(db, "rentals");
onSnapshot(rentalsRef, (snapshot) => {

    // Очищаем локальные активные аренды
    Object.keys(activeRentals).forEach(key => {
        delete activeRentals[key];
    });
    document.querySelectorAll(".rental-item").forEach(card => {

    const status = card.querySelector("div");

    if (!status) return;

    status.className = "status-free";
    status.innerHTML = "🟢 Свободно";

});

    snapshot.forEach((docSnap) => {

        const rental = {
            id: docSnap.id,
            ...docSnap.data()
        };

        // Берём только активные аренды
        if (rental.status !== "active") return;

        // Для тюбингов, батутов и других многократных аренд
        const multiTypes = [
            "trampolines",
            "scooters",
            "miniScooters",
            "tubes"
        ];

        if (multiTypes.includes(rental.type)) {

            if (!activeRentals[rental.name]) {
                activeRentals[rental.name] = [];
            }

            activeRentals[rental.name].push(rental);

        } else {

            activeRentals[rental.name] = rental;

        }

    });

    // Обновляем карточки
    Object.entries(activeRentals).forEach(([name, rental]) => {

        if (Array.isArray(rental)) {
            refreshMultiRental(name);
        } else {
            refreshCard(rental);
        }

    });

});
const cash = {
    cars: 0,
    tubes: 0
};
function updateCash() {

    document.getElementById("cars").textContent =
        cash.cars.toLocaleString() + " ₸";

    document.getElementById("tubes").textContent =
        cash.tubes.toLocaleString() + " ₸";

}
function openRental(name, type) {

    currentRental = {
        name,
        type
    };

    document.getElementById("modalTitle").textContent = name;
    document.getElementById("clientName").value = "";

    const timeSelect = document.getElementById("rentTime");
    timeSelect.innerHTML = "";

    const config = rentalConfig[type];

    config.times.forEach(time => {
        const option = document.createElement("option");
        option.value = time;
        option.textContent = `${time} минут`;
        timeSelect.appendChild(option);
    });

    updatePrice();

    document.getElementById("rentalModal").style.display = "flex";
}
function updatePrice() {

    if (!currentRental) return;

    const minutes = Number(document.getElementById("rentTime").value);

    const config = rentalConfig[currentRental.type];

    let price = 0;

    if (currentRental.type === "cars") {

        const base = config.items[currentRental.name];

        price = base * (minutes / 10);

    } else {

        price = config.price * (minutes / config.times[0]);

    }

    document.getElementById("rentPrice").textContent =
        price.toLocaleString() + " ₸";
}
document
    .getElementById("rentTime")
    .addEventListener("change", updatePrice);


function drawGrid(id, list, icon, type){

    const grid = document.getElementById(id);
    grid.innerHTML = "";

    list.forEach(name => {

    const card = document.createElement("div");
    card.className = "rental-item";

    card.dataset.name = name;
    card.dataset.type = type;

        card.innerHTML = `
            <h3>${icon} ${name}</h3>
            <div class="status-free">🟢 Свободно</div>
        `;

card.onclick = () => {

    const multiTypes = [
    "trampolines",
    "scooters",
    "miniScooters",
    "tubes"
];

if (!multiTypes.includes(type) && activeRentals[name]) {
    return;
}

    openRental(name, type);

};

grid.appendChild(card);

});

}
function refreshCard(rental){

    document.querySelectorAll(".rental-item").forEach(card=>{

        if(card.dataset.name !== rental.name) return;

        const status = card.querySelector("div");

        const diff = rental.endTime - Date.now();

        if(diff >= 0){

            const min = Math.floor(diff/60000);
            const sec = Math.floor((diff%60000)/1000);

            status.className = "status-busy";

            status.innerHTML = `
                🟡 Занято<br>
                ${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}<br><br>

                <button class="finishRent">
                    ✅ Сдать
                </button>
            `;

        }else{

        const totalSeconds = Math.abs(Math.floor(diff / 1000));

        const min = Math.floor(totalSeconds / 60);
        const sec = totalSeconds % 60;

            status.className = "status-over";

            status.innerHTML = `
                🔴 Просрочено<br>
                -${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}<br><br>

                <button class="finishRent">
                    ✅ Сдать
                </button>
            `;

        }

        const btn = status.querySelector(".finishRent");

        if(btn){

            btn.onclick = (e)=>{

                e.stopPropagation();

                finishRental(rental.name);

            };

        }

    });

}
function refreshMultiRental(name){

    const card = [...document.querySelectorAll(".rental-item")]
        .find(c => c.dataset.name === name);

    if(!card) return;

    const status = card.querySelector("div");

    const clients = activeRentals[name] || [];

    status.className = "status-busy";

    let html = "";

    clients.forEach((client,index)=>{

        const diff = client.endTime - Date.now();

        const totalSeconds = Math.abs(Math.floor(diff / 1000));

        const min = Math.floor(totalSeconds / 60);
        const sec = totalSeconds % 60;

        html += `
            <div style="margin-bottom:8px">

                <b>${client.client}</b><br>

                ${diff>=0 ? "🟡" : "🔴"}

                ${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}

                <br>

                <button class="finishClient"
                    data-name="${name}"
                    data-index="${index}">
                    ✅ Сдать
                </button>

                <hr>

            </div>
        `;

    });

    status.innerHTML = html;

status.querySelectorAll(".finishClient").forEach(btn => {

    btn.addEventListener("click", (e) => {

        e.stopPropagation();

        finishMultiRental(
            btn.dataset.name,
            Number(btn.dataset.index)
        );

    });

});

}

drawGrid("carsGrid", Object.keys(rentalConfig.cars.items), "🚗", "cars");

drawGrid("scootersGrid", rentalConfig.scooters.items, "🛴", "scooters");

drawGrid("miniCarsGrid", rentalConfig.miniCars.items, "🚙", "miniCars");

drawGrid("miniScootersGrid", rentalConfig.miniScooters.items, "🛵", "miniScooters");

drawGrid("trampolineGrid", rentalConfig.trampolines.items, "🎪", "trampolines");

drawGrid("tubeGrid", rentalConfig.tubes.items, "🛟", "tubes");
document.getElementById("closeModal").onclick = () => {

    document.getElementById("rentalModal").style.display = "none";

};
document.getElementById("startRent").onclick = async () => {

    if (isStartingRent) return;

    isStartingRent = true;

    const btn = document.getElementById("startRent");

    btn.disabled = true;
    btn.textContent = "⏳ Создание...";

    try {

        if (!currentRental) return;

    const client = document.getElementById("clientName").value.trim();

    const minutes = Number(document.getElementById("rentTime").value);

    const payment = document.getElementById("rentPayment").value;

    const price = Number(
        document
            .getElementById("rentPrice")
            .textContent
            .replace(/[^\d]/g, "")
    );

const startTime = Date.now();
const endTime = startTime + minutes * 60000;

currentRental.client = client;
currentRental.minutes = minutes;
currentRental.payment = payment;
currentRental.price = price;
currentRental.startTime = startTime;
currentRental.endTime = endTime;

const rentalData = {
    name: currentRental.name,
    type: currentRental.type,
    client: currentRental.client,
    minutes: currentRental.minutes,
    payment: currentRental.payment,
    price: currentRental.price,

    startTime: currentRental.startTime,
    endTime: currentRental.endTime,

    status: "active",

    createdAt: serverTimestamp()
};

const rentalDoc = await addDoc(
    rentalsRef,
    rentalData
);

currentRental.id = rentalDoc.id;

await window.addSale({
    service:
        currentRental.type === "tubes"
            ? "Тюбинг"
            : "Машинки",

    amount: price,

    payment: payment
});


document.getElementById("rentStatus").innerHTML =
    "🟡 Аренда запущена";

document.getElementById("rentalModal").style.display = "none";

console.log(currentRental);

    } catch (e) {

        console.error(e);
        alert("Ошибка сохранения аренды");

    } finally {

        btn.disabled = false;
        btn.textContent = "▶ Начать";
        isStartingRent = false;

    }

};




setInterval(() => {

    Object.entries(activeRentals).forEach(([name, rental]) => {

if (Array.isArray(rental)) {

    refreshMultiRental(name);

} else {

            refreshCard(rental);

        }

    });

}, 1000);
async function finishRental(name){

    try {

        const rental = activeRentals[name];

        if (!rental) return;

        // Если это обычный аттракцион
        if (!Array.isArray(rental) && rental.id) {

            await deleteDoc(
                doc(db, "rentals", rental.id)
            );

        }

        delete activeRentals[name];

        document.querySelectorAll(".rental-item").forEach(card => {

            if (card.dataset.name !== name) return;

            card.querySelector("div").className = "status-free";

            card.querySelector("div").innerHTML =
                "🟢 Свободно";

            card.onclick = () => {

                const multiTypes = [
                    "trampolines",
                    "scooters",
                    "miniScooters",
                    "tubes"
                ];

                if (
                    !multiTypes.includes(card.dataset.type) &&
                    activeRentals[card.dataset.name]
                ) {
                    return;
                }

                openRental(
                    card.dataset.name,
                    card.dataset.type
                );

            };

        });

    } catch (error) {

        console.error(
            "Ошибка удаления аренды:",
            error
        );

        alert(
            "Не удалось завершить аренду. Проверьте интернет."
        );

    }

}
async function finishMultiRental(name, index) {

    try {

        const rentals = activeRentals[name];

        if (!Array.isArray(rentals)) {
            return;
        }

        const rental = rentals[index];

        if (!rental) {
            return;
        }

        // Запоминаем ID ДО удаления из Firebase
        const rentalId = rental.id;

        if (!rentalId) {
            console.error("У аренды отсутствует ID Firebase");
            return;
        }

        // Удаляем только из Firebase.
        // onSnapshot() сам обновит интерфейс.
        await deleteDoc(
            doc(db, "rentals", rentalId)
        );

    } catch (error) {

        console.error(
            "Ошибка завершения аренды:",
            error
        );

        alert(
            "Не удалось завершить аренду. Проверьте интернет."
        );

    }

}