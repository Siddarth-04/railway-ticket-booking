if (!requireAdmin()) { }

const alertBox = 'alert-box';
let currentTab = 'trains';

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('tab-trains').classList.toggle('active', tab === 'trains');
    document.getElementById('tab-bookings').classList.toggle('active', tab === 'bookings');
    document.getElementById('section-trains').classList.toggle('hidden', tab !== 'trains');
    document.getElementById('section-bookings').classList.toggle('hidden', tab !== 'bookings');
    
    if (tab === 'trains') fetchTrains();
    else fetchAllBookings();
}

// ─── TRAIN MANAGEMENT ───────────────────────────────────────────

async function fetchTrains() {
    const container = document.getElementById('trains-container');
    try {
        const { ok, data } = await apiFetch('/api/trains');
        if (ok) renderTrains(data.data);
    } catch (err) {
        showAlert(alertBox, 'Failed to fetch trains.');
    }
}

function renderTrains(trains) {
    const container = document.getElementById('trains-container');
    let html = `
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Train Name</th>
                        <th>Route</th>
                        <th>Schedule</th>
                        <th>Seats</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    trains.forEach(t => {
        html += `
            <tr>
                <td><strong>${t.train_name}</strong></td>
                <td>${t.source} → ${t.destination}</td>
                <td>${formatTime(t.departure_time)} - ${formatTime(t.arrival_time)}</td>
                <td>${t.available_seats} / ${t.total_seats}</td>
                <td class="text-gold">${formatCurrency(t.price)}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="editTrain(${JSON.stringify(t).replace(/"/g, '&quot;')})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteTrain(${t.train_id})">Delete</button>
                </td>
            </tr>
        `;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

function openTrainModal(isEdit = false) {
    document.getElementById('modal-title').textContent = isEdit ? 'Edit Train' : 'Add New Train';
    document.getElementById('train-form').reset();
    document.getElementById('train-id').value = '';
    document.getElementById('train-modal').classList.add('active');
}

function closeTrainModal() {
    document.getElementById('train-modal').classList.remove('active');
}

function editTrain(train) {
    openTrainModal(true);
    document.getElementById('train-id').value = train.train_id;
    document.getElementById('train_name').value = train.train_name;
    document.getElementById('source').value = train.source;
    document.getElementById('destination').value = train.destination;
    document.getElementById('departure_time').value = train.departure_time;
    document.getElementById('arrival_time').value = train.arrival_time;
    document.getElementById('total_seats').value = train.total_seats;
    document.getElementById('price').value = train.price;
}

document.getElementById('train-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('train-id').value;
    const trainData = {
        train_name: document.getElementById('train_name').value,
        source: document.getElementById('source').value,
        destination: document.getElementById('destination').value,
        departure_time: document.getElementById('departure_time').value,
        arrival_time: document.getElementById('arrival_time').value,
        total_seats: document.getElementById('total_seats').value,
        available_seats: document.getElementById('total_seats').value, // Reset availability on new/edit
        price: document.getElementById('price').value,
    };

    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/api/admin/update-train/${id}` : '/api/admin/add-train';

    try {
        const { ok, data } = await apiFetch(endpoint, {
            method,
            body: JSON.stringify(trainData)
        });
        if (ok) {
            showAlert(alertBox, `Train ${id ? 'updated' : 'added'} successfully!`, 'success');
            closeTrainModal();
            fetchTrains();
        } else {
            showAlert(alertBox, data.message || 'Operation failed.');
        }
    } catch (err) {
        showAlert(alertBox, 'Server error.');
    }
});

async function deleteTrain(id) {
    if (!confirm('Are you sure you want to delete this train? This will delete all associated bookings.')) return;
    try {
        const { ok } = await apiFetch(`/api/admin/delete-train/${id}`, { method: 'DELETE' });
        if (ok) {
            showAlert(alertBox, 'Train deleted.', 'success');
            fetchTrains();
        }
    } catch (err) {
        showAlert(alertBox, 'Server error.');
    }
}

// ─── BOOKINGS OVERVIEW ──────────────────────────────────────────

async function fetchAllBookings() {
    const container = document.getElementById('bookings-container');
    try {
        const { ok, data } = await apiFetch('/api/admin/bookings');
        if (ok) renderAllBookings(data.data);
    } catch (err) {
        showAlert(alertBox, 'Failed to fetch bookings.');
    }
}

function renderAllBookings(bookings) {
    const container = document.getElementById('bookings-container');
    let html = `
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>PNR</th>
                        <th>Passenger</th>
                        <th>Train</th>
                        <th>Journey Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    bookings.forEach(b => {
        html += `
            <tr>
                <td><strong class="text-gold">${b.pnr_number}</strong></td>
                <td>
                    <div>${b.passenger_name}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">${b.passenger_email}</div>
                </td>
                <td>${b.train_name}</td>
                <td>${formatDate(b.journey_date)}</td>
                <td>${formatCurrency(b.total_amount)} (${b.seat_count})</td>
                <td><span class="badge ${b.booking_status === 'CANCELLED' ? 'badge-cancelled' : 'badge-confirmed'}">${b.booking_status}</span></td>
            </tr>
        `;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

// Initial Load
fetchTrains();
