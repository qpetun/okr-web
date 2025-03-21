document.addEventListener('DOMContentLoaded', function() {
    // Функция проверки токена
    function isValidToken() {
        const token = localStorage.getItem('authToken');
        if (!token) return false;  
        
        return true;
    }
    
    // Функция для очистки данных авторизации
    function clearAuthData() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('tokenExpiry');
        localStorage.removeItem('user');
    }
    
    // Получаем текущую страницу
    const currentPage = window.location.pathname.split('/').pop();
    
    // Проверяем валидность токена авторизации
    const isLoggedIn = isValidToken();
    
    // Список страниц, требующих авторизации
    const authRequiredPages = [
        'profile.html',
        'applications.html',
        'application.html',
        'application-details.html',
        'user-roles.html'
        
    ];
    
    // Проверяем, нужна ли авторизация для текущей страницы
    if (!isLoggedIn && authRequiredPages.includes(currentPage)) {
        // Если пользователь не авторизован и страница требует авторизации,
        // перенаправляем на страницу логина
        window.location.href = 'login.html';
        return; // Прекращаем выполнение скрипта
    }
    
    // Функция создания хедера на основе ролей пользователя
    function createHeader(userRoles) {
        // Базовая структура хедера
        let headerHTML = `
            <div class="header-container">
                <div class="logo">
                    <h1 style="user-select: none;">Система учета пропусков</h1>
                </div>
                <nav class="main-nav">
                    <ul>
                        
        `;
        
        // Добавляем пункты меню в зависимости от авторизации
        if (isLoggedIn) {
            // Меню для авторизованных пользователей
            headerHTML += `
                <li><a href="profile.html" ${currentPage === 'profile.html' ? 'class="active"' : ''}>Профиль</a></li>
            `;
            
            // Проверяем роль пользователя для отображения соответствующих пунктов меню
            if (userRoles && userRoles.isStudent) {
                headerHTML += `
                    <li><a href="application.html" ${currentPage === 'application.html' ? 'class="active"' : ''}>Создать заявку</a></li>
                `;
            }
            
            // Пункт "Заявки" доступен всем авторизованным пользователям
            headerHTML += `
                <li><a href="applications.html" ${currentPage === 'applications.html' ? 'class="active"' : ''}>Заявки</a></li>
            `;
            
            // Добавляем вкладку для управления ролями пользователей для админа и деканата
            if (userRoles && (userRoles.isAdmin || userRoles.isDean)) {
                headerHTML += `
                    <li><a href="rolepage.html" ${currentPage === 'rolepage.html' ? 'class="active"' : ''}>Управление ролями</a></li>
                `;
            }
            
            // Кнопка выхода для всех авторизованных пользователей
            headerHTML += `
                <li><a href="#" id="logout-btn">Выход</a></li>
            `;
        } else {
            // Меню для неавторизованных пользователей
            headerHTML += `
                <li><a href="login.html" ${currentPage === 'login.html' ? 'class="active"' : ''}>Вход</a></li>
                <li><a href="registration.html" ${currentPage === 'registration.html' ? 'class="active"' : ''}>Регистрация</a></li>
            `;
        }
        
        // Закрываем структуру хедера
        headerHTML += `
                    </ul>
                </nav>
            </div>
        `;
        
        // Находим элемент header и вставляем в него HTML
        const headerElement = document.querySelector('header.main-header');
        if (headerElement) {
            headerElement.innerHTML = headerHTML;
        }
        
        // Добавляем обработчик для кнопки выхода
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                clearAuthData();
                window.location.href = 'login.html';
            });
        }
    }
    
    if (isLoggedIn) {
        // Получаем роли пользователя через API
        fetch('http://51.250.46.2:1111/roles', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при получении ролей');
            }
            return response.json();
        })
        .then(roles => {
            // Создаем хедер с полученными ролями
            createHeader(roles);
        })
        .catch(error => {
            console.error('Ошибка:', error);
            // В случае ошибки все равно создаем хедер, но без специфичных для ролей элементов
            createHeader(null);
        });
    } else {
        // Для неавторизованных пользователей просто создаем базовый хедер
        createHeader(null);
    }
});