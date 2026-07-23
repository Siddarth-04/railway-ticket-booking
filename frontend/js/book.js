// Check auth
if (!requireAuth()) { /* Redirects handled in config.js */ }

const selectedTrain = JSON.parse(localStorage.getItem('selected_train'));
if (!selectedTrain) {
    window.location.href = 'search.html';
}

// Set train info
document.getElementById('train-name-heading').textContent = selectedTrain.name;
document.getElementById('train-route-subheading').textContent = `Loading route and price...`;

let basePricePerSeat = 0;
let availableSeatsCount = 0;
let selectedSeats = [];

// AC 3 Tier Coach (B1) usually has 72 seats in LHB coaches.
// 9 bays of 8 seats (6 in main compartment, 2 side berths).
const TOTAL_SEATS = 72;
let seatData = [];

async function init() {
    const { ok, data } = await apiFetch('/api/trains');
    if (ok) {
        const train = data.data.find(t => t.train_id === selectedTrain.id);
        if (train) {
            basePricePerSeat = parseFloat(train.price);
            availableSeatsCount = train.available_seats;
            document.getElementById('train-route-subheading').textContent = `${train.source} to ${train.destination} | #${train.train_id + 12000}`;
            
            generateSeatMap();
        }
    }
}

init();

function generateSeatMap() {
    const gridContainer = document.getElementById('seat-map-grid');
    gridContainer.innerHTML = '';
    seatData = [];

    // Calculate how many seats to mark as booked to match `availableSeatsCount`
    // Ensure we don't have negative available seats
    let toBook = TOTAL_SEATS - (availableSeatsCount > TOTAL_SEATS ? TOTAL_SEATS : availableSeatsCount);
    if(toBook < 0) toBook = 0;

    // Create an array of 72 seats
    for (let i = 1; i <= TOTAL_SEATS; i++) {
        seatData.push({
            id: i,
            status: 'available', // available, booked, ladies
            isLadies: false
        });
    }

    // Randomly assign 'booked' status to `toBook` number of seats
    let bookedIndices = new Set();
    while (bookedIndices.size < toBook) {
        bookedIndices.add(Math.floor(Math.random() * TOTAL_SEATS));
    }
    bookedIndices.forEach(idx => seatData[idx].status = 'booked');

    // Make 4 random available seats 'ladies quota' for realism
    let ladiesIndices = new Set();
    while(ladiesIndices.size < Math.min(4, TOTAL_SEATS - toBook)) {
        let rand = Math.floor(Math.random() * TOTAL_SEATS);
        if(seatData[rand].status === 'available') {
            seatData[rand].isLadies = true;
            ladiesIndices.add(rand);
        }
    }

    // Render 9 bays
    for (let bay = 0; bay < 9; bay++) {
        const bayDiv = document.createElement('div');
        bayDiv.className = 'bay-container';
        bayDiv.innerHTML = `<div class="bay-label">Bay ${bay + 1}</div>`;
        
        const grid = document.createElement('div');
        grid.className = 'seat-grid';
        
        // 8 seats per bay
        const startSeat = bay * 8 + 1;
        
        // Main compartment (Left side): Lower, Middle, Upper (Window to Aisle)
        // Side compartment (Right side): Side Lower, Side Upper
        const layoutIndices = [
            startSeat, startSeat+1, startSeat+2, startSeat+6, // Row 1 (Lower, Middle, Upper, Side Lower)
            startSeat+3, startSeat+4, startSeat+5, startSeat+7  // Row 2 (Lower, Middle, Upper, Side Upper)
        ];

        const labels = ['L', 'M', 'U', 'SL', 'L', 'M', 'U', 'SU'];

        layoutIndices.forEach((seatNum, idx) => {
            const seatObj = seatData[seatNum - 1];
            if (!seatObj) return;

            const seatEl = document.createElement('div');
            seatEl.className = `seat ${seatObj.status} ${seatObj.isLadies ? 'ladies' : ''}`;
            seatEl.innerHTML = `
                <div style="font-size: 1rem;">${seatNum}</div>
                <div style="font-size: 0.65rem; color: var(--text-muted);">${labels[idx]}</div>
            `;
            
            if (seatObj.status === 'available') {
                seatEl.onclick = () => toggleSeat(seatNum, seatEl);
            }

            grid.appendChild(seatEl);
        });

        bayDiv.appendChild(grid);
        gridContainer.appendChild(bayDiv);
    }
}

function toggleSeat(seatNum, seatEl) {
    const idx = selectedSeats.indexOf(seatNum);
    if (idx > -1) {
        selectedSeats.splice(idx, 1);
        seatEl.classList.remove('selected');
    } else {
        if (selectedSeats.length >= 6) {
            showAlert('alert-box', 'You can select a maximum of 6 seats per booking.', 'warning');
            return;
        }
        selectedSeats.push(seatNum);
        seatEl.classList.add('selected');
    }
    
    updateSummary();
}

function updateSummary() {
    const count = selectedSeats.length;
    document.getElementById('sel-count').textContent = count;
    
    if (count === 0) {
        document.getElementById('sel-seats-list').textContent = 'None';
        document.getElementById('base-fare').textContent = '₹ 0.00';
        document.getElementById('tax-amount').textContent = '₹ 0.00';
        document.getElementById('total-price').textContent = '₹ 0.00';
        document.getElementById('book-btn').disabled = true;
        return;
    }

    const sortedSeats = [...selectedSeats].sort((a,b) => a-b);
    document.getElementById('sel-seats-list').textContent = sortedSeats.join(', ');

    const base = basePricePerSeat * count;
    const tax = base * 0.18;
    const total = base + tax;

    document.getElementById('base-fare').textContent = formatCurrency(base);
    document.getElementById('tax-amount').textContent = formatCurrency(tax);
    document.getElementById('total-price').textContent = formatCurrency(total);
    
    document.getElementById('book-btn').disabled = false;
}

// Handle booking submission
document.getElementById('booking-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (selectedSeats.length === 0) return;

    const journey_date = document.getElementById('journey_date').value;
    const alertBox = 'alert-box';
    const bookBtn = document.getElementById('book-btn');

    bookBtn.disabled = true;
    bookBtn.textContent = 'Processing Payment...';

    try {
        const { ok, data } = await apiFetch('/api/book', {
            method: 'POST',
            body: JSON.stringify({
                train_id: selectedTrain.id,
                journey_date,
                seat_count: selectedSeats.length
            })
        });

        if (ok) {
            // Show success modal
            document.getElementById('modal-pnr').textContent = data.data.pnr_number;
            document.getElementById('modal-train').textContent = data.data.train_name;
            document.getElementById('modal-seats').textContent = selectedSeats.sort((a,b)=>a-b).join(', ');
            document.getElementById('success-modal').classList.add('active');
            localStorage.removeItem('selected_train');
        } else {
            showAlert(alertBox, data.message || 'Booking failed.');
            bookBtn.disabled = false;
            bookBtn.textContent = 'Continue to payment';
        }
    } catch (err) {
        showAlert(alertBox, 'Server error. Please try again.');
        console.error(err);
        bookBtn.disabled = false;
        bookBtn.textContent = 'Continue to payment';
    }
});

function closeModal() {
    document.getElementById('success-modal').classList.remove('active');
    window.location.href = 'myBookings.html';
}
