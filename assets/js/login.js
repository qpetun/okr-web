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
                    
                    // Сохраняем время истечения токена (текущее время + 2 часа)
                    const expiryTime = new Date().getTime() + (2 * 60 * 60 * 1000); // 2 часа в миллисекундах
                    localStorage.setItem('tokenExpiry', expiryTime);
                    
                    // Перенаправляем на главную страницу или дашборд
                    window.location.href = 'profile.html'; 
                } else {
                    showError('Ошибка авторизации: токен не получен');
                }
            } else {
                // Неуспешная авторизация
                showError('Неверный email или пароль. Пожалуйста, попробуйте снова.');
            }
        } catch (error) {
            // Ошибка сети
            console.error('Ошибка:', error);
            showError('Не удалось соединиться с сервером. Проверьте подключение к интернету.');
        }
    });
    
    // Функция для отображения ошибок (более красивый вариант вместо alert)
    function showError(message) {
        // Проверяем, существует ли уже элемент с ошибкой
        let errorElement = document.querySelector('.error-message');
        
        // Если элемента нет, создаем новый
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            const formContainer = document.querySelector('.form-container');
            formContainer.insertBefore(errorElement, loginForm);
        }
        
        // Устанавливаем сообщение об ошибке
        errorElement.textContent = message;
        
        // Автоматически скрываем сообщение через 5 секунд
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
        }, 5000);
    }
});