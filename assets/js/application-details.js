document.addEventListener('DOMContentLoaded', function() {
    
    // Инициализация страницы
    initPage();

    // Настройка обработчиков событий
    setupEventListeners();
});

// Глобальные переменные
let userRoles = null;
let currentApplication = null;
let usersData = [];
let applicationId = null;

// Инициализация страницы
async function initPage() {
    try {
        // Получаем ID заявки из URL
        applicationId = getApplicationIdFromUrl();
        if (!applicationId) {
            showMessage('error', 'Идентификатор заявки не указан');
            setTimeout(() => {
                window.location.href = 'applications.html';
            }, 2000);
            return;
        }

        // Получаем роли пользователя
        await fetchUserRoles();

        // Загружаем список пользователей
        await fetchUsers();

        // Загружаем данные заявки
        await loadApplicationDetails();

    } catch (error) {
        console.error('Ошибка инициализации страницы:', error);
        showMessage('error', 'Не удалось загрузить данные. Пожалуйста, обновите страницу.');
    }
}

// Получение ID заявки из URL
function getApplicationIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработчик для кнопки выхода
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'logout-btn') {
            e.preventDefault();
            logout();
        }
    });

    // Обработчик для кнопки удаления заявки
    const deleteBtn = document.getElementById('delete-application-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            deleteApplication();
        });
    }

    // Обработчики для кнопок изменения статуса заявки (для деканата)
    const approveBtn = document.getElementById('approve-application-btn');
    const rejectBtn = document.getElementById('reject-application-btn');
    
    if (approveBtn) {
        approveBtn.addEventListener('click', function() {
            changeApplicationStatus('Accepted');
        });
    }
    
    if (rejectBtn) {
        rejectBtn.addEventListener('click', function() {
            changeApplicationStatus('Rejected');
        });
    }

    // Обработчик для кнопки добавления продления
    const addExtensionBtn = document.getElementById('add-extension-btn');
    if (addExtensionBtn) {
        addExtensionBtn.addEventListener('click', function() {
            showExtensionForm();
        });
    }

    // Обработчик для кнопки отмены добавления продления
    const cancelExtensionBtn = document.getElementById('cancel-extension-btn');
    if (cancelExtensionBtn) {
        cancelExtensionBtn.addEventListener('click', function() {
            hideExtensionForm();
        });
    }

    // Обработчик для формы добавления продления
    const extensionForm = document.getElementById('extension-form');
    if (extensionForm) {
        extensionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitExtensionForm();
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
    const existingMessage = document.querySelector('.success-message, .error-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageElement = document.createElement('div');
    messageElement.className = type === 'success' ? 'success-message' : 'error-message';
    messageElement.textContent = text;

    const container = document.querySelector('.application-details-container');
    container.insertBefore(messageElement, container.firstChild.nextSibling);

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
    // Элементы для студента
    const studentElements = document.querySelectorAll('.student-only');
    // Элементы для деканата
    const deanElements = document.querySelectorAll('.dean-only');
    // Элементы для преподавателя
    const teacherElements = document.querySelectorAll('.teacher-only');

    // Отображаем элементы в зависимости от роли
    studentElements.forEach(el => {
        el.style.display = userRoles.isStudent ? 'block' : 'none';
    });

    deanElements.forEach(el => {
        el.style.display = (userRoles.isDean || userRoles.isAdmin) ? 'flex' : 'none';
    });

    teacherElements.forEach(el => {
        el.style.display = userRoles.isTeacher ? 'block' : 'none';
    });

    // Кнопка удаления видна только для студентов и их собственных заявок
    const deleteBtn = document.getElementById('delete-application-btn');
    if (deleteBtn && currentApplication) {
        // Скрываем кнопку, если это не заявка текущего студента или статус не "На проверке"
        if (!userRoles.isStudent || currentApplication.status !== 'inProcess') {
            deleteBtn.style.display = 'none';
        }
    }
}


// Загрузка данных заявки
async function loadApplicationDetails() {
    const applicationLoading = document.getElementById('application-loading');
    const applicationContent = document.getElementById('application-content');

    try {
        // Загружаем конкретную заявку по ID
        const response = await fetch(`http://51.250.46.2:1111/application/${applicationId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Не удалось загрузить данные заявки');
        }

        // Получаем данные заявки
        currentApplication = await response.json();
        
        console.log('Данные заявки:', currentApplication);

        // Заполняем информацию о заявке
        populateApplicationDetails();

        // Скрываем загрузку и показываем контент
        applicationLoading.style.display = 'none';
        applicationContent.style.display = 'block';

        // Обновляем UI в зависимости от роли
        updateUIBasedOnRoles();

    } catch (error) {
        console.error('Ошибка при загрузке данных заявки:', error);
        applicationLoading.innerHTML = '<div class="error-message">Не удалось загрузить данные заявки</div>';
    }
}

// Заполнение данных заявки на странице
function populateApplicationDetails() {
    // Заполняем основную информацию
    document.getElementById('student-name').textContent = getUserFullName(currentApplication.userId);
    
    // Форматируем даты
    const fromDate = new Date(currentApplication.fromDate).toLocaleDateString('ru-RU');
    const toDate = new Date(currentApplication.toDate).toLocaleDateString('ru-RU');
    document.getElementById('application-period').textContent = `с ${fromDate} по ${toDate}`;
    
    document.getElementById('application-description').textContent = currentApplication.description;
    
    // Отображаем статус
    const statusElement = document.getElementById('application-status');
    let statusText = 'Неизвестно';
    let statusClass = '';
    
    switch (currentApplication.status) {
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
    
    statusElement.textContent = statusText;
    statusElement.className = `application-status ${statusClass}`;
    
    // Отображаем документ, если есть
    const documentContainer = document.getElementById('document-container');
    const documentElement = document.getElementById('application-document');
    
    if (currentApplication.image && currentApplication.image.trim() !== '') {
        // Определяем тип файла из строки base64
        const fileExtension = getFileExtensionFromBase64(currentApplication.image);
        const fileName = `document.${fileExtension}`;
        
        // Проверяем, является ли файл изображением
        const isImage = isImageFile(currentApplication.image);
        
        let documentPreview = '';
        if (isImage) {
            // Если это изображение, показываем предпросмотр
            documentPreview = `<img src="${currentApplication.image}" alt="Подтверждающий документ" class="document-image">`;
        } else if (fileExtension === 'pdf') {
            // Если PDF, показываем иконку PDF
            documentPreview = `<div class="pdf-icon"><i class="fa fa-file-pdf-o"></i> PDF документ</div>`;
        } else {
            // Для других типов файлов показываем общую иконку
            documentPreview = `<div class="file-icon"><i class="fa fa-file-o"></i> Документ</div>`;
        }
        
        documentElement.innerHTML = `
            <div class="document-preview">
                ${documentPreview}
                <a href="${currentApplication.image}" download="${fileName}" class="document-download">Скачать документ</a>
            </div>
        `;
        documentContainer.style.display = 'flex';
    } else {
        documentContainer.style.display = 'none';
    }
    
    // Отображаем продления
    displayExtensions();
}

// Отображение продлений
// Отображение продлений
function displayExtensions() {
    const extensionsList = document.getElementById('extensions-list');
    
    // Если нет продлений
    if (!currentApplication.extensions || currentApplication.extensions.length === 0) {
        extensionsList.innerHTML = '<div class="no-extensions">Продления отсутствуют</div>';
        return;
    }
    
    // Сортируем продления по дате (сначала новые)
    const sortedExtensions = [...currentApplication.extensions].sort((a, b) => 
        new Date(b.extensionToDate) - new Date(a.extensionToDate)
    );
    
    // Формируем HTML для списка продлений
    let html = '';
    
    sortedExtensions.forEach(extension => {
        // Определяем статус продления
        let statusText = 'Неизвестно';
        let statusClass = '';
        
        switch (extension.status) {
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
        
        // Создаем HTML для документа, если он есть
        let documentHtml = '';
        if (extension.image && extension.image.trim() !== '') {
            // Определяем тип файла из строки base64
            const fileExtension = getFileExtensionFromBase64(extension.image);
            const fileName = `extension-document.${fileExtension}`;
            
            // Проверяем, является ли файл изображением
            const isImage = isImageFile(extension.image);
            
            let documentPreview = '';
            if (isImage) {
                // Если это изображение, показываем предпросмотр
                documentPreview = `<img src="${extension.image}" alt="Документ продления" class="document-image">`;
            } else if (fileExtension === 'pdf') {
                // Если PDF, показываем иконку PDF
                documentPreview = `<div class="pdf-icon"><i class="fa fa-file-pdf-o"></i> PDF документ</div>`;
            } else {
                // Для других типов файлов показываем общую иконку
                documentPreview = `<div class="file-icon"><i class="fa fa-file-o"></i> Документ</div>`;
            }
            
            documentHtml = `
                <div class="extension-document">
                    <div class="document-preview">
                        ${documentPreview}
                        <a href="${extension.image}" download="${fileName}" class="document-download">Скачать документ</a>
                    </div>
                </div>
            `;
        }
        
        // Кнопки управления для деканата (для продлений в статусе "На проверке")
        let actionButtons = '';
        if ((userRoles.isDean || userRoles.isAdmin)) {
            actionButtons = `
                <div class="extension-actions">
                    <button class="btn extension-approve-btn" data-id="${extension.id}">Одобрить</button>
                    <button class="btn extension-reject-btn" data-id="${extension.id}">Отклонить</button>
                </div>
            `;
        }
        
        // Собираем HTML для одного продления
        html += `
            <div class="extension-item">
                <div class="extension-header">
                    <div class="extension-dates">
                        Продление до: ${formatDate(extension.extensionToDate)}
                    </div>
                    <div class="extension-status ${statusClass}">${statusText}</div>
                </div>
                <div class="extension-description">${extension.description}</div>
                ${documentHtml}
                ${actionButtons}
            </div>
        `;
    });
    
    extensionsList.innerHTML = html;
    
    // Добавляем обработчики для кнопок одобрения/отклонения продлений
    document.querySelectorAll('.extension-approve-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const extensionId = this.getAttribute('data-id');
            changeExtensionStatus(extensionId, 'Accepted');
        });
    });
    
    document.querySelectorAll('.extension-reject-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const extensionId = this.getAttribute('data-id');
            changeExtensionStatus(extensionId, 'Rejected');
        });
    });
}

// Изменение статуса заявки
async function changeApplicationStatus(newStatus) {
    try {
        const response = await fetch(`http://51.250.46.2:1111/application/${applicationId}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Не удалось изменить статус заявки');
        }

        // Обновляем данные заявки
        currentApplication = await response.json();
        
        // Обновляем отображение
        populateApplicationDetails();
        
        // Показываем сообщение об успехе
        const statusText = newStatus === 'Accepted' ? 'одобрена' : 'отклонена';
        showMessage('success', `Заявка успешно ${statusText}`);
        
        // Обновляем UI в зависимости от роли
        updateUIBasedOnRoles();

    } catch (error) {
        console.error('Ошибка при изменении статуса заявки:', error);
        showMessage('error', 'Не удалось изменить статус заявки');
    }
}

// Изменение статуса продления
async function changeExtensionStatus(extensionId, newStatus) {
    try {
        const response = await fetch(`http://51.250.46.2:1111/extensionApplication/${extensionId}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Не удалось изменить статус продления');
        }

        // Обновляем данные заявки
        currentApplication = await response.json();
        
        // Обновляем отображение
        populateApplicationDetails();
        
        // Показываем сообщение об успехе
        const statusText = newStatus === 'Accepted' ? 'одобрено' : 'отклонено';
        showMessage('success', `Продление успешно ${statusText}`);

    } catch (error) {
        console.error('Ошибка при изменении статуса продления:', error);
        showMessage('error', 'Не удалось изменить статус продления');
    }
}
// Удаление заявки
async function deleteApplication() {
    // Подтверждение удаления
    if (!confirm('Вы действительно хотите удалить эту заявку?')) {
        return;
    }

    try {
        const response = await fetch(`http://51.250.46.2:1111/application/${applicationId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Не удалось удалить заявку');
        }

        // Показываем сообщение об успехе
        showMessage('success', 'Заявка успешно удалена');
        
        // Перенаправляем на список заявок через 2 секунды
        setTimeout(() => {
            window.location.href = 'applications.html';
        }, 2000);

    } catch (error) {
        console.error('Ошибка при удалении заявки:', error);
        showMessage('error', 'Не удалось удалить заявку');
    }
}

// Показать форму добавления продления
function showExtensionForm() {
    const extensionFormContainer = document.getElementById('extension-form-container');
    extensionFormContainer.style.display = 'block';
    
    // Устанавливаем минимальную дату для продления (следующий день после текущей даты окончания)
    const extensionToDateInput = document.getElementById('extension-to-date');
    
    // Определяем актуальную дату окончания (либо из последнего продления, либо из основной заявки)
    let currentEndDate;
    
    if (currentApplication.extensions && currentApplication.extensions.length > 0) {
        // Находим последнее продление со статусом "одобрено"
        const approvedExtensions = currentApplication.extensions.filter(ext => ext.status === 'Accepted');
        
        if (approvedExtensions.length > 0) {
            // Сортируем по дате (сначала новые)
            approvedExtensions.sort((a, b) => new Date(b.extensionToDate) - new Date(a.extensionToDate));
            currentEndDate = new Date(approvedExtensions[0].extensionToDate);
        } else {
            currentEndDate = new Date(currentApplication.toDate);
        }
    } else {
        currentEndDate = new Date(currentApplication.toDate);
    }
    
    // Добавляем один день
    currentEndDate.setDate(currentEndDate.getDate() + 1);
    
    // Форматируем дату для input type="date" (YYYY-MM-DD)
    const minDate = currentEndDate.toISOString().split('T')[0];
    extensionToDateInput.min = minDate;
    
    // Устанавливаем значение по умолчанию (текущая дата окончания + 7 дней)
    const defaultDate = new Date(currentEndDate);
    defaultDate.setDate(defaultDate.getDate() + 6); // +7 дней от текущей даты окончания
    extensionToDateInput.value = defaultDate.toISOString().split('T')[0];
    
    // Фокусируемся на поле описания
    document.getElementById('extension-description').focus();
}

// Скрыть форму добавления продления
function hideExtensionForm() {
    document.getElementById('extension-form-container').style.display = 'none';
    document.getElementById('extension-form').reset();
}

// Отправка формы продления
async function submitExtensionForm() {
    // Получаем данные из формы
    const extensionToDate = document.getElementById('extension-to-date').value;
    const description = document.getElementById('extension-description').value;
    const documentFile = document.getElementById('extension-document').files[0];
    

    const formData = new FormData();
    // Проверяем обязательные поля
    if (!extensionToDate || !description) {
        showMessage('error', 'Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    // Создаем объект с данными для отправки
    const extensionData = {
        extensionToDate: new Date(extensionToDate).toISOString(),
        description: description,        
        image: documentFile ? await fileToBase64(documentFile) : null
    };
    
    try {
        // Если есть файл, сначала загружаем его
        
        
        // Отправляем запрос на создание продления
        const response = await fetch(`http://51.250.46.2:1111/extensionApplication/${applicationId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(extensionData)
        });
        
        if (!response.ok) {
            throw new Error('Не удалось создать продление');
        }
        
        // Получаем обновленные данные заявки
        await loadApplicationDetails();
        
        // Скрываем форму
        hideExtensionForm();
        
        // Показываем сообщение об успехе
        showMessage('success', 'Продление успешно создано');
        
    } catch (error) {
        console.error('Ошибка при создании продления:', error);
        showMessage('error', 'Не удалось создать продление');
    }
}

// Функция для форматирования даты в строку
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result); 
        reader.onerror = error => reject(error);
    });
}



function getFileExtensionFromBase64(base64String) {
    // Извлекаем MIME-тип из строки base64
    const match = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    
    if (match && match[1]) {
        const mimeType = match[1];
        
        // Словарь соответствия MIME-типов расширениям файлов
        const mimeToExtension = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/vnd.ms-excel': 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'text/plain': 'txt'
        };
        
        return mimeToExtension[mimeType] || 'bin'; // bin как расширение по умолчанию
    }
    
    return 'bin'; // Если не удалось определить тип
}

// Функция для проверки, является ли файл изображением
function isImageFile(base64String) {
    const match = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    
    if (match && match[1]) {
        return match[1].startsWith('image/');
    }
    
    return false;
}