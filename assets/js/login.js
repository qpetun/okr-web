// login.js

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    
    // Обработка отправки формы
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Сбор данных формы
        const loginData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };
        
        // Отправка данных
        try {
            const response = await fetch('http://51.250.46.2:1111/login', {
                method: 'POST',
                headers: {                    
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });
            
            // Проверка статуса
            if (response.ok) {
                const data = await response.json();
                
                // Сохраняем токен в localStorage
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    
                    // Перенаправляем на главную страницу или дашборд
                    window.location.href = 'profile.html'; 
                } else {
                    alert('Ошибка авторизации: токен не получен');
                }
            } else {
                // Неуспешная авторизация
                alert('Неверный email или пароль. Пожалуйста, попробуйте снова.');
            }
        } catch (error) {
            // Ошибка сети
            console.error('Ошибка:', error);
            alert('Не удалось соединиться с сервером. Проверьте подключение к интернету.');
        }
    });
});