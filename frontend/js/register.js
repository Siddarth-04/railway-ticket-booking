document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const alertBox = 'alert-box';

    const submitBtn = e.target.querySelector('button');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
        const { ok, data } = await apiFetch('/api/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, phone, password })
        });

        if (ok) {
            showAlert(alertBox, 'Registration successful! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showAlert(alertBox, data.message || 'Registration failed. Please try again.');
        }
    } catch (err) {
        showAlert(alertBox, 'Server error. Please check your connection.');
        console.error(err);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }
});
