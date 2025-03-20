document.addEventListener('DOMContentLoaded', function() {
    
    
    // Инициализация страницы
    initPage();
    
    // Настройка обработчиков событий
    setupEventListeners();
});

// Глобальные переменные
let userRoles = null;
let allApplications = []; // Все загруженные заявки
let usersData = []; // Данные всех пользователей
let currentPage = 1;
let itemsPerPage = 10;
let currentFilters = {
    status: 'all',
    dateFrom: '',
    dateTo: '',
    searchQuery: ''
};

// Инициализация страницы
async function initPage() {
    try {
        // Получаем роли пользователя
        await fetchUserRoles();
        
        // Загружаем список пользователей
        await fetchUsers();
        
        // Загружаем заявки в зависимости от роли
        await loadApplications();
        
    } catch (error) {
        console.error('Ошибка инициализации страницы:', error);
        showMessage('error', 'Не удалось загрузить данные. Пожалуйста, обновите страницу.');
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработчик для кнопки выхода
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
    
    // Обработчик для кнопки экспорта
    const exportBtn = document.getElementById('export-applications-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportApplications();
        });
    }
    
    // Обработчик для кнопки применения фильтров
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            applyFilters();
        });
    }
    
    // Обработчик для поля поиска (поиск при вводе)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            // Задержка для предотвращения слишком частых обновлений при быстром вводе
            clearTimeout(searchInput.searchTimeout);
            searchInput.searchTimeout = setTimeout(() => {
                currentFilters.searchQuery = this.value.trim();
                currentPage = 1; // Сбрасываем на первую страницу
                displayFilteredApplications();
            }, 100);
        });
    }
}
// Получение токена из localStorage
function getToken() {
    return localStorage.getItem('authToken');
}

// Выход из системы
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
}

// Отображение сообщений
function showMessage(type, text) {
    const messageElement = document.createElement('div');
    messageElement.className = type === 'success' ? 'success-message' : 'error-message';
    messageElement.textContent = text;
    
    const container = document.querySelector('.applications-container');
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
        
        // Обновляем интерфейс на основе ролей
        updateUIBasedOnRoles();
        
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
        
        usersData = await response.json();
        console.log('Загруженные пользователи:', usersData);
        
    } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error);
        throw error;
    }
}

// Функция для получения ФИО пользователя по ID
function getUserFullName(userId) {
    const user = usersData.find(u => u.id === userId);
    if (user) {
        return `${user.surname} ${user.name}`;
    }
    return 'Неизвестный пользователь';
}

// Обновление интерфейса в зависимости от ролей пользователя
function updateUIBasedOnRoles() {
    const exportBtn = document.getElementById('export-applications-btn');
    const createBtn = document.getElementById('create-application-btn');
    
    // Кнопка экспорта видна только для деканата и администраторов
    if (exportBtn) {
        exportBtn.style.display = (userRoles.isDean || userRoles.isAdmin) ? 'block' : 'block';
    }
    
    // Кнопка создания заявки видна только для студентов
    if (createBtn) {
        createBtn.style.display = userRoles.isStudent ? 'block' : 'none';
    }
    
    // Настраиваем заголовок в зависимости от роли
    const headerTitle = document.querySelector('.applications-header h2');
    if (headerTitle) {
        if (userRoles.isStudent && !userRoles.isTeacher && !userRoles.isDean && !userRoles.isAdmin) {
            headerTitle.textContent = 'Мои заявки на пропуск занятий';
        } else if (userRoles.isTeacher) {
            headerTitle.textContent = 'Заявки студентов на пропуск занятий';
        } else if (userRoles.isDean) {
            headerTitle.textContent = 'Управление заявками на пропуск занятий';
        }
    }
}

// Загрузка заявок
async function loadApplications() {
    const applicationsList = document.getElementById('applications-list');
    applicationsList.innerHTML = '<div class="loading-spinner">Загрузка заявок...</div>';
    
    try {
        // Выбираем URL в зависимости от роли
        let url = 'http://51.250.46.2:1111/application';
        if (userRoles.isStudent && !userRoles.isTeacher && !userRoles.isDean && !userRoles.isAdmin) {
            url = 'http://51.250.46.2:1111/application/my';
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Не удалось загрузить заявки');
        }
        
        allApplications = await response.json();
        console.log('Загруженные заявки:', allApplications);
        
        // Отображаем заявки с учетом фильтров и пагинации
        displayFilteredApplications();
        
    } catch (error) {
        console.error('Ошибка при загрузке заявок:', error);
        applicationsList.innerHTML = '<div class="error-message">Не удалось загрузить заявки</div>';
    }
}

// Применение фильтров
function applyFilters() {
    // Получаем значения фильтров
    const statusFilter = document.getElementById('status-filter').value;
    const dateFromFilter = document.getElementById('date-from').value;
    const dateToFilter = document.getElementById('date-to').value;
    const searchQuery = document.getElementById('search-input').value.trim();
    
    // Обновляем текущие фильтры
    currentFilters = {
        status: statusFilter,
        dateFrom: dateFromFilter,
        dateTo: dateToFilter,
        searchQuery: searchQuery
    };
    
    // Сбрасываем на первую страницу
    currentPage = 1;
    
    // Отображаем отфильтрованные заявки
    displayFilteredApplications();
}

// Фильтрация заявок
function filterApplications() {
    return allApplications.filter(app => {
        // Фильтр по статусу
        if (currentFilters.status !== 'all' && app.status !== currentFilters.status) {
            return false;
        }
        
        // Фильтр по дате начала
        if (currentFilters.dateFrom) {
            const fromDate = new Date(app.fromDate);
            const filterFromDate = new Date(currentFilters.dateFrom);
            // Сбрасываем часы, минуты и секунды для корректного сравнения дат
            fromDate.setHours(0, 0, 0, 0);
            filterFromDate.setHours(0, 0, 0, 0);
            
            if (fromDate < filterFromDate) {
                return false;
            }
        }
        
        // Фильтр по дате окончания
        if (currentFilters.dateTo) {
            const toDate = new Date(app.toDate);
            const filterToDate = new Date(currentFilters.dateTo);
            // Сбрасываем часы, минуты и секунды для корректного сравнения дат
            toDate.setHours(0, 0, 0, 0);
            filterToDate.setHours(0, 0, 0, 0);
            
            if (toDate > filterToDate) {
                return false;
            }
        }
        
        // Поиск по описанию и ФИО пользователя
        if (currentFilters.searchQuery) {
            const searchQuery = currentFilters.searchQuery.toLowerCase();
            
            // Поиск по описанию
            const descriptionMatch = app.description.toLowerCase().includes(searchQuery);
            
            // Поиск по ФИО
            const user = usersData.find(u => u.id === app.userId);
            const userFullName = user ? `${user.surname} ${user.name}`.toLowerCase() : '';
            const userMatch = userFullName.includes(searchQuery);
            
            // Если не найдено ни в описании, ни в ФИО
            if (!descriptionMatch && !userMatch) {
                return false;
            }
        }
        
        return true;
    });
}

// Отображение отфильтрованных заявок с пагинацией
function displayFilteredApplications() {
    const applicationsList = document.getElementById('applications-list');
    
    // Применяем фильтры
    const filteredApplications = filterApplications();
    
    // Если заявок нет, показываем соответствующее сообщение
    if (filteredApplications.length === 0) {
        applicationsList.innerHTML = `
            <div class="no-applications">
                <p>Заявки не найдены</p>
            </div>
        `;
        
        // Скрываем пагинацию
        updatePagination(0);
        return;
    }
    
    // Применяем пагинацию
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredApplications.length);
    const paginatedApplications = filteredApplications.slice(startIndex, endIndex);
    
    // Формируем HTML для списка заявок
    let html = '';
    
    paginatedApplications.forEach(app => {
        // Форматируем даты
        const fromDate = new Date(app.fromDate).toLocaleDateString('ru-RU');
        const toDate = new Date(app.toDate).toLocaleDateString('ru-RU');
        
        // Получаем ФИО пользователя
        const userFullName = getUserFullName(app.userId);
        
        // Определяем статус
        let statusText = 'Неизвестно';
        let statusClass = '';
        switch (app.status) {
            case 'inProcess': 
                statusText = 'На проверке'; 
                statusClass = 'status-inProcess'; 
                break;
            case 'Accepted': 
                statusText = 'Одобрено'; 
                statusClass = 'status-accepted'; 
                break;
            case 'Rejected': 
                statusText = 'Отклонено'; 
                statusClass = 'status-rejected'; 
                break;
        }
        
        // Проверяем наличие неподтвержденных продлений
        const hasUnconfirmedExtensions = app.extensions && app.extensions.some(ext => ext.status === 'inProcess');
        
        // Формируем информацию о продлениях
        let extensionsInfo = '';
        if (app.extensions && app.extensions.length > 0) {
            const unconfirmedCount = app.extensions.filter(ext => ext.status === 'inProcess').length;
            
            if (unconfirmedCount > 0) {
                // Если есть неподтвержденные продления, подсвечиваем их
                extensionsInfo = `
                    <div class="has-extensions has-unconfirmed-extensions">
                        Продлений: ${app.extensions.length} 
                        <span class="unconfirmed-badge">${unconfirmedCount} на проверке</span>
                    </div>
                `;
            } else {
                extensionsInfo = `<div class="has-extensions">Продлений: ${app.extensions.length}</div>`;
            }
        }
        
        // Формируем карточку заявки
        html += `
            <div class="application-card ${hasUnconfirmedExtensions ? 'has-unconfirmed' : ''}" data-id="${app.id}">
                <div class="application-header">
                    <div class="application-dates">${fromDate} - ${toDate}</div>
                    <div class="application-status ${statusClass}">${statusText}</div>
                </div>
                <div class="application-user">${userFullName}</div>
                <div class="application-description">${app.description.substring(0, 100)}${app.description.length > 100 ? '...' : ''}</div>
                <div class="application-footer">
                    ${app.image ? '<div class="has-document">Документ прикреплен</div>' : ''}
                    ${extensionsInfo}
                </div>
            </div>
        `;
    });
    
    applicationsList.innerHTML = html;
    
    // Обновляем пагинацию
    updatePagination(filteredApplications.length);
    
    // Добавляем обработчики для карточек заявок
    document.querySelectorAll('.application-card').forEach(card => {
        card.addEventListener('click', function() {
            const applicationId = this.getAttribute('data-id');
            window.location.href = `application-details.html?id=${applicationId}`;
        });
    });
}

// Обновление пагинации
function updatePagination(totalItems) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHtml = '';
    
    // Кнопка "Предыдущая"
    paginationHtml += `
        <button class="pagination-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''}>
            &laquo; Назад
        </button>
    `;
    
    // Номера страниц
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <button class="pagination-btn page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                ${i}
            </button>
        `;
    }
    
    // Кнопка "Следующая"
    paginationHtml += `
        <button class="pagination-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''}>
            Вперед &raquo;
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHtml;
    
    // Добавляем обработчики для кнопок пагинации
    const prevBtn = paginationContainer.querySelector('.prev-btn');
    const nextBtn = paginationContainer.querySelector('.next-btn');
    const pageButtons = paginationContainer.querySelectorAll('.page-btn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                displayFilteredApplications();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
                displayFilteredApplications();
            }
        });
    }
    
    pageButtons.forEach(button => {
        button.addEventListener('click', function() {
            const page = parseInt(this.getAttribute('data-page'));
            if (page !== currentPage) {
                currentPage = page;
                displayFilteredApplications();
            }
        });
    });
}


// Экспорт заявок в CSV
function exportApplications() {
    // Получаем отфильтрованные заявки
    const filteredApplications = filterApplications();
    
    if (filteredApplications.length === 0) {
        showMessage('error', 'Нет заявок для экспорта');
        return;
    }
    
    // Добавляем BOM (Byte Order Mark) для корректного отображения кириллицы в Excel
    let csvContent = '\ufeff';
    
    // Формируем заголовки CSV
    csvContent += 'ID;ФИО;Дата начала;Дата окончания;Статус;Описание;Документ;Продления\n';
    
    // Добавляем данные
    filteredApplications.forEach(app => {
        const fromDate = new Date(app.fromDate).toLocaleDateString('ru-RU');
        const toDate = new Date(app.toDate).toLocaleDateString('ru-RU');
        const userFullName = getUserFullName(app.userId);
        
        let status = '';
        switch (app.status) {
            case 'inProcess': status = 'На проверке'; break;
            case 'Accepted': status = 'Одобрено'; break;
            case 'Rejected': status = 'Отклонено'; break;
            default: status = 'Неизвестно';
        }
        
        // Экранируем запятые и переносы строк в описании
        const safeDescription = app.description.replace(/"/g, '""').replace(/\n/g, ' ');
        
        // Информация о документе
        const hasDocument = app.image ? 'Да' : 'Нет';
        
        // Информация о продлениях
        const extensions = app.extensions && app.extensions.length > 0 ? app.extensions.length : 0;
        
        // Формируем строку CSV
        csvContent += `${app.id};"${userFullName}";"${fromDate}";"${toDate}";"${status}";"${safeDescription}";"${hasDocument}";"${extensions}"\n`;
    });
    
    // Создаем Blob с данными CSV с указанием кодировки UTF-8
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Создаем ссылку для скачивания
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'applications_export.csv';
    
    // Добавляем ссылку на страницу, кликаем по ней и удаляем
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('success', 'Экспорт выполнен успешно');
}