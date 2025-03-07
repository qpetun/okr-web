document.addEventListener('DOMContentLoaded', function() {
    // Получение данных профиля
    fetchProfileData();
    fetchUserRoles();
    
    // Обработчик для кнопки выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

// Глобальная переменная для хранения данных профиля
let profileData = null;
let userRoles = null;

async function fetchProfileData() {
    const profileInfo = document.getElementById('profile-info');
    
    try {
        // Закомментированный API-вызов
        /*
        const response = await fetch('/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Не удалось загрузить данные профиля');
        }
        
        const data = await response.json();
        */
        
        // Заполнение тестовыми данными
        const data = {
            surname: 'Иванов',
            name: 'Иван',
            patronymic: 'Иванович',
            email: 'ivan.ivanov@example.com'
        };
        
        profileData = data;
        
        // Отображаем профиль только если уже получены данные о ролях
        if (userRoles) {
            displayProfileData();
        }
        
    } catch (error) {
        console.error('Ошибка при загрузке профиля:', error);
        profileInfo.innerHTML = `
            <div class="error-message">
                Не удалось загрузить данные профиля. Пожалуйста, попробуйте позже или обратитесь к администратору.
            </div>
        `;
    }
}

async function fetchUserRoles() {
    try {
        // Закомментированный API-вызов
        /*
        const response = await fetch('/roles', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Не удалось загрузить роли пользователя');
        }
        
        const data = await response.json();
        */
        
        // Заполнение тестовыми данными
        const data = {
            isAdmin: false,
            isDean: false,
            isTeacher: true,
            isStudent: false
        };
        
        userRoles = data;
        
        // Отображаем профиль только если уже получены данные профиля
        if (profileData) {
            displayProfileData();
        }
        
    } catch (error) {
        console.error('Ошибка при загрузке ролей:', error);
        // Если нельзя загрузить роли, все равно показываем профиль, если он доступен
        if (profileData) {
            displayProfileData();
        }
    }
}


// Функция для отображения данных профиля
// Функция для отображения данных профиля
function displayProfileData() {
    const profileInfo = document.getElementById('profile-info');
    
    // Формируем строку с ролями пользователя
    let rolesText = 'Нет ролей';
    if (userRoles) {
        const roles = [];
        if (userRoles.isAdmin) roles.push('Администратор');
        if (userRoles.isDean) roles.push('Деканат');
        if (userRoles.isTeacher) roles.push('Преподаватель');
        if (userRoles.isStudent) roles.push('Студент');
        
        if (roles.length > 0) {
            rolesText = roles.join(', ');
        }
    }
    
    profileInfo.innerHTML = `
        <div class="profile-field">
            <div class="profile-field-label">Фамилия</div>
            <div class="profile-field-value">${profileData.surname || '-'}</div>
        </div>
        <div class="profile-field">
            <div class="profile-field-label">Имя</div>
            <div class="profile-field-value">${profileData.name || '-'}</div>
        </div>
        <div class="profile-field">
            <div class="profile-field-label">Отчество</div>
            <div class="profile-field-value">${profileData.patronymic || '-'}</div>
        </div>
        <div class="profile-field">
            <div class="profile-field-label">Email</div>
            <div class="profile-field-value">${profileData.email || '-'}</div>
        </div>
        <div class="profile-field">
            <div class="profile-field-label">Роли</div>
            <div class="profile-field-value">${rolesText}</div>
        </div>
        <div class="profile-actions">
            <button id="edit-profile-btn" class="btn btn-primary">Редактировать</button>
        </div>
    `;
    
    // Добавляем обработчик для кнопки редактирования
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
        editBtn.addEventListener('click', showEditForm);
    }
}

// Функция для отображения формы редактирования
function showEditForm() {
    const profileInfo = document.getElementById('profile-info');
    
    profileInfo.innerHTML = `
        <form id="edit-profile-form" class="edit-profile-form">
            <div class="form-group">
                <label for="surname">Фамилия</label>
                <input type="text" id="surname" name="surname" value="${profileData.surname || ''}" required>
            </div>
            <div class="form-group">
                <label for="name">Имя</label>
                <input type="text" id="name" name="name" value="${profileData.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="patronymic">Отчество</label>
                <input type="text" id="patronymic" name="patronymic" value="${profileData.patronymic || ''}">
            </div>
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" value="${profileData.email || ''}" disabled>
                <div class="form-hint">Email нельзя изменить</div>
                <div class="form-hint"></div>
            </div>
            <div class="form-actions">
                <button type="button" id="cancel-edit-btn" class="btn btn-secondary">Отмена</button>
                <button type="submit" class="btn btn-primary">Сохранить</button>
            </div>
        </form>
    `;
    
    // Обработчик для кнопки отмены
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            displayProfileData(profileData);
        });
    }
    
    // Обработчик для формы редактирования
    const editForm = document.getElementById('edit-profile-form');
    if (editForm) {
        editForm.addEventListener('submit', updateProfile);
    }
}

// Функция для обновления профиля
async function updateProfile(e) {
    e.preventDefault();
    
    const updatedData = {
        surname: document.getElementById('surname').value,
        name: document.getElementById('name').value,
        patronymic: document.getElementById('patronymic').value
    };
    
    // Добавляем индикатор загрузки
    const formActions = document.querySelector('.form-actions');
    formActions.innerHTML = '<div class="loading-spinner">Сохранение...</div>';
    
    try {
        const response = await fetch('/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(updatedData)
        });
        
        if (!response.ok) {
            throw new Error('Не удалось обновить профиль');
        }
        
        const data = await response.json();
        profileData = data;
        
        // Отображаем обновленные данные
        displayProfileData(profileData);
        
        // Показываем сообщение об успешном обновлении
        showMessage('success', 'Профиль успешно обновлен');
        
    } catch (error) {
        console.error('Ошибка при обновлении профиля:', error);
        showMessage('error', 'Не удалось обновить профиль. Пожалуйста, попробуйте позже.');
        
        // Возвращаем форму редактирования
        showEditForm();
    }
}

// Функция для отображения сообщений
function showMessage(type, text) {
    // Создаем элемент сообщения
    const messageElement = document.createElement('div');
    messageElement.className = type === 'success' ? 'success-message' : 'error-message';
    messageElement.textContent = text;
    
    // Добавляем сообщение на страницу
    const container = document.querySelector('.profile-container');
    container.insertBefore(messageElement, container.firstChild);
    
    // Автоматически удаляем сообщение через 3 секунды
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 3000);
}

// Функция для получения токена из localStorage
function getToken() {
    return localStorage.getItem('token') || '';
}

// Функция для выхода из системы
function logout() {
    // Удаляем токен из localStorage
    localStorage.removeItem('token');
    // Перенаправляем на страницу входа
    window.location.href = 'login.html';
}