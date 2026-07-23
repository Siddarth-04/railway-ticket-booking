if (!requireAuth()) { }

const bookingsContainer = document.getElementById('bookings-container');
const alertBox = 'alert-box';

async function fetchMyBookings() {
    try {
        const { ok, data } = await apiFetch('/api/my-bookings');

        if (ok) {
            if (data.data.length === 0) {
                bookingsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">🎫</div>
                        <h3>No bookings yet</h3>
                        <p>You haven't booked any tickets. Start by searching for trains!</p>
                        <a href="search.html" class="btn btn-primary mt-2">Find Trains</a>
                    </div>
                `;
            } else {
                renderBookings(data.data);
            }
        } else {
            showAlert(alertBox, data.message || 'Failed to load bookings.');
            bookingsContainer.innerHTML = '';
        }
    } catch (err) {
        showAlert(alertBox, 'Server error.');
        console.error(err);
    }
}

function renderBookings(bookings) {
    let html = `
        <div class="grid-2">
    `;

    bookings.forEach(booking => {
        const isCancelled = booking.booking_status === 'CANCELLED';
        html += `
            <div class="card">
                <div class="card-header">
                    <div>
                        <span class="badge ${isCancelled ? 'badge-cancelled' : 'badge-confirmed'}">${booking.booking_status}</span>
                        <div class="text-secondary mt-1" style="font-size: 0.8rem;">PNR: <strong class="text-gold">${booking.pnr_number}</strong></div>
                    </div>
                    <div class="text-right">
                        <div class="text-gold" style="font-size: 1.25rem; font-weight: 800;">${formatCurrency(booking.total_amount)}</div>
                        <div class="text-muted" style="font-size: 0.75rem;">${booking.seat_count} Passenger(s)</div>
                    </div>
                </div>

                <div class="mb-2">
                    <h3 class="text-primary">${booking.train_name}</h3>
                    <p class="text-secondary" style="font-size: 0.9rem;">
                        ${booking.source} → ${booking.destination}
                    </p>
                    <p class="text-secondary" style="font-size: 0.85rem;">
    Seat(s): <strong>${booking.seat_numbers || 'N/A'}</strong>
</p>
                </div>

                <div class="grid-2 mb-2" style="background: var(--bg-card2); padding: 0.75rem; border-radius: 8px;">
                    <div>
                        <div class="text-muted" style="font-size: 0.7rem; text-transform: uppercase;">Departure</div>
                        <div style="font-weight: 600;">${formatTime(booking.departure_time)}</div>
                    </div>
                    <div>
                        <div class="text-muted" style="font-size: 0.7rem; text-transform: uppercase;">Journey Date</div>
                        <div style="font-weight: 600;">${formatDate(booking.journey_date)}</div>
                    </div>
                </div>

                        <div class="flex-center" style="justify-content: flex-end; gap: 0.5rem;">
            <button class="btn btn-primary btn-sm"
                onclick="downloadTicket(${booking.booking_id})">
                Download Ticket
            </button>

            ${!isCancelled ? `
                <button class="btn btn-danger btn-sm"
                    onclick="cancelBooking(${booking.booking_id})">
                    Cancel Ticket
                </button>
            ` : ''}
        </div>
    </div>
        `;
    });

    html += `</div>`;
    bookingsContainer.innerHTML = html;
}

async function cancelBooking(id) {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;

    try {
        const { ok, data } = await apiFetch('/api/cancel', {
            method: 'POST',
            body: JSON.stringify({ booking_id: id })
        });

        if (ok) {
            showAlert(alertBox, 'Booking cancelled successfully.', 'success');
            fetchMyBookings();
        } else {
            showAlert(alertBox, data.message || 'Cancellation failed.');
        }
    } catch (err) {
        showAlert(alertBox, 'Server error.');
        console.error(err);
    }
}
async function downloadTicket(id) {
    try {
        const token = localStorage.getItem('railwaypro_token');

        const response = await fetch(`http://localhost:5000/api/ticket/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(text);
            throw new Error('Download failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();

    } catch (err) {
        showAlert(alertBox, 'Could not download ticket.');
        console.error(err);
    }
}

fetchMyBookings();
