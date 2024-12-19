const wheelCanvas = document.getElementById("wheel");
const ctx = wheelCanvas.getContext("2d");
const addButton = document.getElementById("add-button");
const spinButton = document.getElementById("spin-button");
const saveButton = document.getElementById("save-button");
const loadButton = document.getElementById("load-button");
const nameInput = document.getElementById("name-input");
const groupContainer = document.getElementById("group-container");
const addGroupButton = document.getElementById("add-group-button");
const removeGroupButton = document.getElementById("remove-group-button");

let names = [];
let currentAngle = 0;
let isSpinning = false;
let groupCount = 2; // Default two groups: A and B

function drawWheel() {
    const radius = wheelCanvas.width / 2;
    const centerX = wheelCanvas.width / 2;
    const centerY = wheelCanvas.height / 2;
    const segmentAngle = (2 * Math.PI) / names.length;

    ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);

    names.forEach((name, index) => {
        const startAngle = currentAngle + index * segmentAngle;
        const endAngle = startAngle + segmentAngle;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.fillStyle = `hsl(${(index / names.length) * 360}, 70%, 60%)`;
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.translate(
            centerX + Math.cos(startAngle + segmentAngle / 2) * (radius * 0.7),
            centerY + Math.sin(startAngle + segmentAngle / 2) * (radius * 0.7)
        );
        ctx.rotate(startAngle + segmentAngle / 2);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "16px Arial";
        ctx.fillText(name, 0, 0);
        ctx.restore();
    });
}

function spinWheel() {
    if (isSpinning || names.length === 0) return;

    isSpinning = true;
    const spinDuration = 3000;
    const spinEndAngle = Math.random() * Math.PI * 4 + Math.PI * 4;

    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        const easing = progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        currentAngle += easing * spinEndAngle;

        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            selectWinner();
            isSpinning = false;
        }
    }

    animate();
}

function selectWinner() {
    const segmentAngle = (2 * Math.PI) / names.length;
    const winnerIndex = Math.floor(((2 * Math.PI - (currentAngle % (2 * Math.PI))) / segmentAngle) % names.length);
    const winner = names.splice(winnerIndex, 1)[0];

    drawWheel();

    // Ambil semua grup
    const groups = Array.from(groupContainer.querySelectorAll(".group ul"));
    if (groups.length === 0) {
        alert("No groups available to assign the winner!");
        return;
    }

    // Cari baris yang belum penuh
    let targetGroup = null;
    let rowIndex = 0;

    while (!targetGroup) {
        // Filter grup berdasarkan panjang elemen di baris tertentu
        const candidates = groups.filter(group => group.children.length === rowIndex);

        if (candidates.length > 0) {
            // Pilih grup secara acak dari kandidat
            targetGroup = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
            // Jika tidak ada kandidat, lanjutkan ke baris berikutnya
            rowIndex++;
        }
    }

    // Tambahkan nama ke grup yang ditemukan
    const listItem = document.createElement("li");
    listItem.textContent = winner;
    targetGroup.appendChild(listItem);
}


function saveNames() {
    const groupData = Array.from(groupContainer.querySelectorAll(".group")).map(group => ({
        name: group.querySelector("h2").textContent,
        members: Array.from(group.querySelectorAll("li")).map(li => li.textContent)
    }));
    const data = {
        wheelNames: names,
        groups: groupData
    };
    localStorage.setItem("wheelData", JSON.stringify(data));
    alert("Data saved!");
}

function loadNames() {
    const savedData = JSON.parse(localStorage.getItem("wheelData"));
    if (savedData) {
        names = savedData.wheelNames || [];

        // Clear existing groups
        groupContainer.innerHTML = "";

        // Add groups from saved data
        savedData.groups.forEach((group, index) => {
            const groupDiv = document.createElement("div");
            groupDiv.className = "group";
            groupDiv.id = `group-${index + 1}`;
            groupDiv.innerHTML = `
                <h2>${group.name}</h2>
                <ul>${group.members.map(member => `<li>${member}</li>`).join("")}</ul>
            `;
            groupContainer.appendChild(groupDiv);
        });

        groupCount = savedData.groups.length;
        drawWheel();
        alert("Data loaded!");
    } else {
        alert("No saved data found!");
    }
}

function addGroup() {
    groupCount++;
    const groupDiv = document.createElement("div");
    groupDiv.className = "group";
    groupDiv.id = `group-${groupCount}`;
    groupDiv.innerHTML = `
        <h2>Group ${String.fromCharCode(64 + groupCount)}</h2>
        <ul></ul>
    `;
    groupContainer.appendChild(groupDiv);
}

function removeGroup() {
    if (groupCount > 2) {
        const lastGroup = document.getElementById(`group-${groupCount}`);
        groupContainer.removeChild(lastGroup);
        groupCount--;
    } else {
        alert("You must have at least two groups!");
    }
}

addButton.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (name && !names.includes(name)) {
        names.push(name);
        nameInput.value = "";
        drawWheel();
    }
});

spinButton.addEventListener("click", spinWheel);
saveButton.addEventListener("click", saveNames);
loadButton.addEventListener("click", loadNames);
addGroupButton.addEventListener("click", addGroup);
removeGroupButton.addEventListener("click", removeGroup);

drawWheel();

function downloadDataAsFormattedCSV() {
    const groupData = Array.from(groupContainer.querySelectorAll(".group")).map(group => ({
        name: group.querySelector("h2").textContent,
        members: Array.from(group.querySelectorAll("li")).map(li => li.textContent)
    }));

    // Buat header tabel
    let csvContent = "Group Name,Member\n";

    // Iterasi grup untuk menambahkan data
    groupData.forEach(group => {
        if (group.members.length > 0) {
            group.members.forEach((member, index) => {
                csvContent += `${index === 0 ? `"${group.name}"` : ""},${`"${member}"`}\n`;
            });
        } else {
            // Jika grup kosong, tambahkan grup dengan keterangan kosong
            csvContent += `"${group.name}",- (No Members)\n`;
        }
    });

    // Membuat file CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Membuat link unduhan
    const a = document.createElement("a");
    a.href = url;
    a.download = "group-data.csv";
    document.body.appendChild(a);
    a.click();

    // Membersihkan elemen unduhan
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Tambahkan event listener ke tombol Download
document.getElementById("download-button").addEventListener("click", downloadDataAsFormattedCSV);
