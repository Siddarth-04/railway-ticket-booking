document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const source = document.getElementById('source').value;
    const destination = document.getElementById('destination').value;
    const resultsContainer = document.getElementById('results-container');
    const alertBox = 'alert-box';

    resultsContainer.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';

    try {
        const { ok, data } = await apiFetch(`/api/trains/search?source=${source}&destination=${destination}`);

        if (ok) {
            if (data.data.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">🚂</div>
                        <h3>No trains found</h3>
                        <p>We couldn't find any trains between <strong>${source}</strong> and <strong>${destination}</strong>.</p>
                    </div>
                `;
            } else {
                renderResults(data.data);
            }
        } else {
            showAlert(alertBox, data.message || 'Search failed.');
            resultsContainer.innerHTML = '';
        }
    } catch (err) {
        showAlert(alertBox, 'Server error. Could not fetch trains.');
        resultsContainer.innerHTML = '';
        console.error(err);
    }
});

function renderResults(trains) {
    const resultsContainer = document.getElementById('results-container');
    
    let html = `<div style="display: flex; flex-direction: column; gap: 1.5rem;">`;

    trains.forEach(train => {
        // Calculate duration if possible, otherwise use a placeholder
        const duration = '05h 30m'; // Placeholder since DB only has HH:mm string

        html += `
            <div class="card" style="padding: 0; display: flex; flex-direction: column;">
                <!-- Main Info Row -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 1.5rem 2rem; border-bottom: 1px solid var(--border);">
                    
                    <div style="flex: 1;">
                        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--navy);">${train.train_name}</h3>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">#${train.train_id + 12000} | Departs on all days</div>
                    </div>

                    <div style="flex: 2; display: flex; align-items: center; justify-content: center; gap: 2rem;">
                        <div class="text-right">
                            <div style="font-size: 1.25rem; font-weight: 700;">${formatTime(train.departure_time)}</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">${train.source}</div>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; align-items: center; min-width: 100px;">
                            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">${duration}</div>
                            <div style="width: 100%; height: 2px; background: var(--border); position: relative;">
                                <div style="position: absolute; top: -4px; left: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--border);"></div>
                                <div style="position: absolute; top: -4px; right: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--border);"></div>
                            </div>
                        </div>
                        
                        <div>
                            <div style="font-size: 1.25rem; font-weight: 700;">${formatTime(train.arrival_time)}</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">${train.destination}</div>
                        </div>
                    </div>

                    <div style="flex: 1; display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                        <div style="background: ${train.available_seats > 50 ? 'var(--success-bg)' : '#fef2f2'}; color: ${train.available_seats > 50 ? 'var(--success)' : 'var(--danger)'}; padding: 4px 12px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; border: 1px solid ${train.available_seats > 50 ? '#a7f3d0' : '#fecaca'};">
                            ${train.available_seats > 0 ? `Available ${train.available_seats}` : 'Waitlist'}
                        </div>
                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary);">
                            ${formatCurrency(train.price)}
                        </div>
                        <button class="btn btn-primary" onclick="bookTrain(${train.train_id}, '${train.train_name}')" ${train.available_seats === 0 ? 'disabled' : ''}>
                            Select seats
                        </button>
                    </div>

                </div>

                <!-- Competitor Prices -->
                <div style="padding: 1rem 2rem; background: var(--bg-card2);">
                    <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem;">Compare Prices:</div>
                    <div style="display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 0.5rem;">
        `;

        if (train.competitors && train.competitors.length > 0) {
            train.competitors.forEach(comp => {
                const isCheapest = comp.isCheapest;
                html += `
                    <div style="min-width: 150px; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid ${isCheapest ? 'var(--primary)' : 'var(--border)'}; background: #fff; position: relative;">
                        ${isCheapest ? '<div style="position: absolute; top: -8px; right: -8px; background: var(--primary); color: #fff; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: bold;">BEST</div>' : ''}
                        <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">${comp.platform}</div>
                        <div style="font-size: 1.1rem; font-weight: 700; margin-top: 4px; color: ${isCheapest ? 'var(--primary)' : 'var(--text-primary)'};">${formatCurrency(comp.price)}</div>
                    </div>
                `;
            });
        }

        html += `
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;

    resultsContainer.innerHTML = html;
}

function bookTrain(id, name) {
    if (!getToken()) {
        showAlert('alert-box', 'Please login to book tickets.', 'warning');
        setTimeout(() => window.location.href = 'login.html', 2000);
        return;
    }
    
    // Store selected train info in session for booking page
    localStorage.setItem('selected_train', JSON.stringify({ id, name }));
    window.location.href = 'book.html';
}
