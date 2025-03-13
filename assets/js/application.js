document.addEventListener('DOMContentLoaded', function() {
    // Установка минимальной даты (сегодня)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fromDate').min = today;
    document.getElementById('toDate').min = today;
    
    // Обработчик для кнопки отмены
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            // Возвращаемся на предыдущую страницу
            window.history.back();
        });
    }
    
    // Обработчик для кнопки выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Обработчик для формы создания заявки
    const applicationForm = document.getElementById('application-form');
    if (applicationForm) {
        applicationForm.addEventListener('submit', submitApplication);
    }
    
    // Валидация даты окончания (должна быть >= даты начала)
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');
    
    fromDateInput.addEventListener('change', function() {
        toDateInput.min = fromDateInput.value;
        
        // Если текущая дата окончания меньше новой даты начала, обновляем её
        if (toDateInput.value && toDateInput.value < fromDateInput.value) {
            toDateInput.value = fromDateInput.value;
        }
    });
});

// Функция для отправки заявки
async function submitApplication(e) {
    e.preventDefault();
    
    // Получаем данные формы
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    const description = document.getElementById('description').value;
    const imageFile = document.getElementById('image').files[0];
    
    // Проверка дат
    if (new Date(fromDate) > new Date(toDate)) {
        showMessage('error', 'Дата начала не может быть позже даты окончания');
        return;
    }
    
    // Создаем объект FormData для отправки файла
    const formData = new FormData();
    
    // Преобразуем даты в формат ISO
    const fromDateISO = new Date(fromDate).toISOString();
    const toDateISO = new Date(toDate).toISOString();
    
    // Добавляем данные в FormData
    formData.append('fromDate', fromDateISO);
    formData.append('toDate', toDateISO);
    formData.append('description', description);
    
    if (imageFile) {
        // Проверка размера файла (5MB максимум)
        if (imageFile.size > 5 * 1024 * 1024) {
            showMessage('error', 'Размер файла не должен превышать 5MB');
            return;
        }
        
        formData.append('image', imageFile);
    }
    
    // Добавляем индикатор загрузки
    const formActions = document.querySelector('.form-actions');
    const originalFormActions = formActions.innerHTML;
    formActions.innerHTML = '<div class="loading-spinner">Отправка заявки...</div>';
    
    try {
        // Преобразуем FormData в JSON для отправки
        const applicationData = {
            fromDate: fromDateISO,
            toDate: toDateISO,
            description: description,
            image: imageFile ? await fileToBase64(imageFile) : null
        };
        
        
        const response = await fetch('http://51.250.46.2:1111/application', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(applicationData),
            mode: 'cors' // явно указываем режим CORS
        });
        
        if (!response.ok) {
            throw new Error('Не удалось создать заявку');
        }
        
        const data = await response.json();
        
        // Показываем сообщение об успешном создании заявки
        showMessage('success', 'Заявка успешно создана');
        
        // Очищаем форму
        document.getElementById('application-form').reset();
        
        // Перенаправляем на страницу просмотра заявок через 2 секунды
        setTimeout(() => {
            window.location.href = 'applications.html';
        }, 2000);
        
    } catch (error) {
        console.error('Ошибка при создании заявки:', error);
        showMessage('error', 'Не удалось создать заявку. Пожалуйста, попробуйте позже.');
        
        // Возвращаем оригинальные кнопки
        formActions.innerHTML = originalFormActions;
    }
}

// Функция для конвертации файла в base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result); 
        reader.onerror = error => reject(error);
    });
}



// Функция для отображения сообщений
function showMessage(type, text) {
    // Удаляем предыдущие сообщения
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Создаем элемент сообщения
    const messageElement = document.createElement('div');
    messageElement.className = type === 'success' ? 'success-message' : 'error-message';
    messageElement.textContent = text;
    
    // Добавляем сообщение на страницу
    const container = document.querySelector('.application-container');
    container.insertBefore(messageElement, container.firstChild);
    
    // Автоматически удаляем сообщение через 5 секунд
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 5000);
}

// Функция для получения токена из localStorage
function getToken() {
    return localStorage.getItem('authToken') || '';
}

// Функция для выхода из системы
function logout() {
    // Удаляем токен из localStorage
    localStorage.removeItem('authToken');
    // Перенаправляем на страницу входа
    window.location.href = 'login.html';
}