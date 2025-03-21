// admin.js - Скрипт для страницы управления ролями пользователей
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация страницы
    initPage();
    
    // Настройка обработчиков событий
    setupEventListeners();
});

// Глобальные переменные
let userRoles = null;
let allUsers = []; // Все загруженные пользователи
let currentPage = 1;
let itemsPerPage = 10;
let currentSearchQuery = '';
let selectedUserId = null;

// Инициализация страницы
async function initPage() {
    try {
        // Получаем роли пользователя
        await fetchUserRoles();
        
        // Загружаем список пользователей
        await fetchUsers();
        
        // Отображаем список пользователей
        displayUsers();
        
    } catch (error) {
        console.error('Ошибка инициализации страницы:', error);
        showMessage('error', 'Не удалось загрузить данные. Пожалуйста, обновите страницу.');
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработчик для поля поиска
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchInput.searchTimeout);
            searchInput.searchTimeout = setTimeout(() => {
                currentSearchQuery = this.value.trim();
                currentPage = 1; // Сбрасываем на первую страницу
                displayUsers();
            }, 300);
        });
    }
    
    // Обработчик для закрытия модального окна
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            closeRoleModal();
        });
    }
    
    // Обработчик для кнопки отмены в модальном окне
    const cancelRoleBtn = document.getElementById('cancel-role-btn');
    if (cancelRoleBtn) {
        cancelRoleBtn.addEventListener('click', function() {
            closeRoleModal();
        });
    }
    
    // Обработчик для кнопки сохранения роли
    const saveRoleBtn = document.getElementById('save-role-btn');
    if (saveRoleBtn) {
        saveRoleBtn.addEventListener('click', function() {
            saveUserRole();
        });
    }
}

// Получение токена из localStorage
function getToken() {
    return localStorage.getItem('authToken');
}

// Отображение сообщений
function showMessage(type, text) {
    const messageElement = document.createElement('div');
    messageElement.className = type === 'success' ? 'success-message' : 'error-message';
    messageElement.textContent = text;
    
    const container = document.querySelector('.admin-container');
    container.insertBefore(messageElement, container.firstChild);
    
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 3000);
}

// Получение ролей пользователя
async function fetchUserRoles() {
    try {
        const response = await fetch('http://51.250.46.2:1111/roles', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Не удалось загрузить роли пользователя');
        }
        
        userRoles = await response.json();
        console.log('Роли пользователя:', userRoles);
        
        // Проверяем, имеет ли пользователь права администратора
        if (!userRoles.isAdmin && !userRoles.isDean) {
            // Если пользователь не админ и не деканат, перенаправляем на главную
            window.location.href = 'profile.html';
        }
        
    } catch (error) {
        console.error('Ошибка при загрузке ролей:', error);
        throw error;
    }
}

// Загрузка списка пользователей
async function fetchUsers() {
    try {
        const response = await fetch('http://51.250.46.2:1111/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Не удалось загрузить список пользователей');
        }
        
        allUsers = await response.json();
        console.log('Загруженные пользователи:', allUsers);
        
    } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error);
        throw error;
    }
}

// Получение детальной информации о пользователе
async function fetchUserDetails(userId) {
    try {
        const response = await fetch(`http://51.250.46.2:1111/profile/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Не удалось загрузить информацию о пользователе ${userId}`);
        }
        
        const userData = await response.json();
        return userData;
        
    } catch (error) {
        console.error(`Ошибка при загрузке информации о пользователе ${userId}:`, error);
        return {}; // Возвращаем пустой объект в случае ошибки
    }
}

// Фильтрация пользователей по поисковому запросу
function filterUsers() {
    if (!currentSearchQuery) {
        return allUsers;
    }
    
    const query = currentSearchQuery.toLowerCase();
    return allUsers.filter(user => {
        const fullName = `${user.surname} ${user.name}`.toLowerCase();
        return fullName.includes(query);
    });
}

// Отображение списка пользователей с пагинацией
// Отображение списка пользователей с пагинацией
function displayUsers() {
    const usersTableBody = document.getElementById('usersTableBody');
    usersTableBody.innerHTML = '<tr><td colspan="3">Загрузка пользователей...</td></tr>';
    
    // Применяем фильтрацию
    const filteredUsers = filterUsers();
    
    // Если пользователей нет, показываем соответствующее сообщение
    if (filteredUsers.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="3">Пользователи не найдены</td></tr>';
        updatePagination(0);
        return;
    }
    
    // Применяем пагинацию
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredUsers.length);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    // Очищаем таблицу
    usersTableBody.innerHTML = '';
    
    // Добавляем пользователей в таблицу без ожидания детальной информации
    for (const user of paginatedUsers) {
        const tr = document.createElement('tr');
        
        // ФИО пользователя
        const nameTd = document.createElement('td');
        nameTd.textContent = `${user.surname} ${user.name}`;
        tr.appendChild(nameTd);
        
        // Email (будет загружен позже)
        const emailTd = document.createElement('td');
        emailTd.textContent = 'Загрузка...';
        emailTd.dataset.userId = user.id;
        tr.appendChild(emailTd);
        
        // Кнопка управления ролями
        const actionsTd = document.createElement('td');
        const manageBtn = document.createElement('button');
        manageBtn.className = 'btn-manage';
        manageBtn.textContent = 'Изменить';
        manageBtn.dataset.userId = user.id;
        manageBtn.addEventListener('click', function() {
            // При клике на кнопку загружаем детальную информацию и открываем модальное окно
            fetchUserDetails(user.id).then(userDetails => {
                openRoleModal(user.id, { ...user, ...userDetails });
            });
        });
        actionsTd.appendChild(manageBtn);
        tr.appendChild(actionsTd);
        
        usersTableBody.appendChild(tr);
    }
    
    // Обновляем пагинацию
    updatePagination(filteredUsers.length);
    
    // Загружаем email для каждого пользователя асинхронно
    for (const user of paginatedUsers) {
        fetchUserDetails(user.id).then(userDetails => {
            const emailTd = document.querySelector(`td[data-user-id="${user.id}"]`);
            if (emailTd) {
                emailTd.textContent = userDetails.email || 'Нет данных';
            }
        }).catch(error => {
            console.error(`Ошибка при загрузке email для пользователя ${user.id}:`, error);
            const emailTd = document.querySelector(`td[data-user-id="${user.id}"]`);
            if (emailTd) {
                emailTd.textContent = 'Ошибка загрузки';
            }
        });
    }
}

// Обновление пагинации
function updatePagination(totalItems) {
    const paginationElement = document.getElementById('pagination');
    paginationElement.innerHTML = '';
    
    // Если нет элементов, скрываем пагинацию
    if (totalItems === 0) {
        return;
    }
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Кнопка "Предыдущая"
    if (totalPages > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '←';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                displayUsers();
            }
        });
        paginationElement.appendChild(prevBtn);
    }
    
    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === currentPage ? 'active' : '';
        pageBtn.addEventListener('click', function() {
            currentPage = i;
            displayUsers();
        });
        paginationElement.appendChild(pageBtn);
    }
    
    // Кнопка "Следующая"
    if (totalPages > 1) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '→';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
                displayUsers();
            }
        });
        paginationElement.appendChild(nextBtn);
    }
}

// Открытие модального окна для управления ролями пользователя
function openRoleModal(userId, userDetails) {
    selectedUserId = userId;
    
    const modal = document.getElementById('roleModal');
    const userInfo = document.getElementById('userInfo');
    
    // Отображаем информацию о пользователе
    userInfo.innerHTML = `
        <p><strong>ФИО:</strong> ${userDetails.surname} ${userDetails.name}${userDetails.patronymic ? ' ' + userDetails.patronymic : ''}</p>
        <p><strong>Email:</strong> ${userDetails.email || 'Нет данных'}</p>
    `;
    
    // Проверяем, может ли текущий пользователь изменять роли
    if (!userRoles.isAdmin && !userRoles.isDean) {
        userInfo.innerHTML += `
            <div class="error-message">
                У вас недостаточно прав для изменения ролей пользователей.
            </div>
        `;
        
        // Скрываем форму выбора ролей и кнопку сохранения
        document.querySelector('.role-selection').style.display = 'none';
        return;
    }
    
    // Отображаем форму выбора ролей
    document.querySelector('.role-selection').style.display = 'block';
    
    // Проверяем доступные для назначения роли в зависимости от прав текущего пользователя
    const roleOptions = document.querySelector('.role-options');
    roleOptions.innerHTML = `
        <label class="role-option">
            <input type="checkbox" name="role" value="Student"> Студент
        </label>
        <label class="role-option" style="opacity: ${(userRoles.isAdmin || userRoles.isDean) ? 1 : 0.5}">
            <input type="checkbox" name="role" value="Teacher" ${!(userRoles.isAdmin || userRoles.isDean) ? 'disabled' : ''}> Преподаватель
        </label>
        <label class="role-option" style="opacity: ${userRoles.isAdmin ? 1 : 0.5}">
            <input type="checkbox" name="role" value="Dean" ${!userRoles.isAdmin ? 'disabled' : ''}> Деканат
        </label>
    `;
    
    // Отображаем модальное окно
    modal.style.display = 'block';
}

// Закрытие модального окна
function closeRoleModal() {
    const modal = document.getElementById('roleModal');
    modal.style.display = 'none';
    selectedUserId = null;
}

// Сохранение роли пользователя
async function saveUserRole() {
    if (!selectedUserId) {
        showMessage('error', 'Ошибка: пользователь не выбран');
        return;
    }
    
    // Проверяем права пользователя
    if (!userRoles.isAdmin && !userRoles.isDean) {
        showMessage('error', 'У вас недостаточно прав для изменения ролей');
        closeRoleModal();
        return;
    }
    
    // Получаем выбранные роли
    const selectedRoles = document.querySelectorAll('input[name="role"]:checked');
    if (selectedRoles.length === 0) {
        showMessage('error', 'Пожалуйста, выберите хотя бы одну роль');
        return;
    }
    
    // Определяем самую высокую выбранную роль для отправки на сервер
    let highestRole = '';
    
    if (Array.from(selectedRoles).some(role => role.value === 'Dean') && userRoles.isAdmin) {
        highestRole = 'Dean';
    } else if (Array.from(selectedRoles).some(role => role.value === 'Teacher') && (userRoles.isAdmin || userRoles.isDean)) {
        highestRole = 'Teacher';
    } else if (Array.from(selectedRoles).some(role => role.value === 'Student')) {
        highestRole = 'Student';
    }
    
    // Если роль не выбрана или недостаточно прав для выбранной роли
    if (!highestRole) {
        showMessage('error', 'У вас нет прав для назначения выбранной роли');
        return;
    }
    
    try {
        // Отправляем запрос на изменение роли
        const response = await fetch(`http://51.250.46.2:1111/user/${selectedUserId}/role`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ role: highestRole })
        });
        
        if (!response.ok) {
            // Проверяем статус ответа для более детальной обработки ошибок
            if (response.status === 403) {
                throw new Error('У вас недостаточно прав для выполнения этого действия');
            } else {
                throw new Error('Не удалось изменить роль пользователя');
            }
        }
        
        const updatedUser = await response.json();
        console.log('Роль пользователя обновлена:', updatedUser);
        
        // Закрываем модальное окно
        closeRoleModal();
        
        // Показываем сообщение об успехе
        showMessage('success', 'Роль пользователя успешно обновлена');
        
        // Обновляем список пользователей
        displayUsers();
        
    } catch (error) {
        console.error('Ошибка при изменении роли пользователя:', error);
        showMessage('error', error.message);
    }
}

// Обработка нажатия клавиши ESC для закрытия модального окна
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeRoleModal();
    }
});

// Закрытие модального окна при клике вне его содержимого
window.addEventListener('click', function(event) {
    const modal = document.getElementById('roleModal');
    if (event.target === modal) {
        closeRoleModal();
    }
});

// Функция для выхода из системы
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
}