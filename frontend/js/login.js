document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const alertBox = 'alert-box';

    const submitBtn = e.target.querySelector('button');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
        const { ok, data } = await apiFetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (ok) {
            saveSession(data.token, data.user);
            showAlert(alertBox, 'Login successful! Redirecting...', 'success');
            setTimeout(() => {
                // If admin, go to admin dashboard
                if (data.user.role === 'ADMIN') {
                    window.location.href = 'adminDashboard.html';
                } else {
                    window.location.href = 'search.html';
                }
            }, 1000);
        } else {
            showAlert(alertBox, data.message || 'Login failed. Invalid credentials.');
        }
    } catch (err) {
        showAlert(alertBox, 'Server error. Please check your connection.');
        console.error(err);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login to Account';
    }
});
