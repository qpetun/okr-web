// registration.js

document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registration-form');
    
    // Обработка отправки формы
    registrationForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Проверка совпадения паролей
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }
        
        // Сбор данных формы
        const userData = {
            surname: document.getElementById('surname').value,
            name: document.getElementById('name').value,
            patronymic: document.getElementById('patronymic').value || "",
            email: document.getElementById('email').value,
            password: password,
            confirmPassword: confirmPassword
        };
        
        // Отправка данных
        try {
            const response = await fetch('http://51.250.46.2:1111/registration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
           
            if (response.ok) {                
                alert('Регистрация успешно завершена!');
                window.location.href = 'login.html';
            } else {                
                alert('Ошибка при регистрации. Пожалуйста, попробуйте снова.');
            }
        } catch (error) {            
            console.error('Ошибка:', error);
            alert('Не удалось соединиться с сервером. Проверьте подключение к интернету.');
        }
    });
});