
        // State
        let currentPeriod = 1;
        let isDark = localStorage.getItem('theme') === 'dark';
        let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

        // Plan configurations
        const planConfigs = {
            free: {
                name: 'Любители Манги',
                basePrices: { 1: 3, 3: 8, 6: 15, 12: 28 }
            },
            basic: {
                name: 'Любители Пика', 
                basePrices: { 1: 6, 3: 16, 6: 30, 12: 55 }
            },
            premium: {
                name: 'Орден Шейхов',
                basePrices: { 1: 14, 3: 38, 6: 70, 12: 130 }
            },
            vip: {
                name: 'Лисямбы',
                basePrices: { 1: 25, 3: 68, 6: 125, 12: 240 }
            }
        };

        // Theme functionality
        function updateTheme() {
            document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
            
            const updateIcons = (moonClass, sunClass) => {
                const moonIcons = document.querySelectorAll(moonClass);
                const sunIcons = document.querySelectorAll(sunClass);
                
                moonIcons.forEach(icon => {
                    icon.style.display = isDark ? 'none' : 'block';
                });
                
                sunIcons.forEach(icon => {
                    icon.style.display = isDark ? 'block' : 'none';
                });
            };
            
            updateIcons('.moon-icon', '.sun-icon');
            updateIcons('.mobile-moon-icon', '.mobile-sun-icon');
            
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        }

        function toggleTheme() {
            isDark = !isDark;
            updateTheme();
        }

        // Authentication
        function updateAuthState() {
            const authSection = document.getElementById('authSection');
            const userSection = document.getElementById('userSection');
            const logoutBtn = document.getElementById('logoutBtn');
            
            if (isLoggedIn && currentUser) {
                if (authSection) authSection.style.display = 'none';
                if (userSection) userSection.style.display = 'block';
                if (logoutBtn) logoutBtn.style.display = 'block';
                
                const userName = document.getElementById('userName');
                const userEmail = document.getElementById('userEmail');
                if (userName) userName.textContent = currentUser.name;
                if (userEmail) userEmail.textContent = currentUser.email;
            } else {
                if (authSection) authSection.style.display = 'block';
                if (userSection) userSection.style.display = 'none';
                if (logoutBtn) logoutBtn.style.display = 'none';
            }
        }

        function login() {
            const name = prompt('Введите ваше имя:') || 'Пользователь';
            const email = prompt('Введите ваш email:') || 'user@example.com';
            
            if (name && email) {
                currentUser = { name, email };
                isLoggedIn = true;
                
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                updateAuthState();
                closeMenu();
                
                showNotification(`Добро пожаловать, ${name}!`, 'success');
            }
        }

        function logout() {
            if (confirm('Вы уверены, что хотите выйти?')) {
                isLoggedIn = false;
                currentUser = null;
                
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('currentUser');
                
                updateAuthState();
                closeMenu();
                
                showNotification('Вы успешно вышли из системы', 'success');
            }
        }

        // Menu functionality
function toggleMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    sideMenu.classList.toggle('open');
    menuOverlay.classList.toggle('show');
}

function closeMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    sideMenu.classList.remove('open');
    menuOverlay.classList.remove('show');
}

// Event listeners - добавляются ОДИН РАЗ после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    // Profile buttons
    document.getElementById('profileBtn').addEventListener('click', toggleMenu);
    document.getElementById('mobileProfileBtn').addEventListener('click', (e) => {
        e.preventDefault();
        toggleMenu();
    });
    
    // Menu overlay
    document.getElementById('menuOverlay').addEventListener('click', closeMenu);
});

        function updatePrices() {
            Object.keys(planConfigs).forEach(planType => {
                const config = planConfigs[planType];
                const priceElement = document.querySelector(`[data-price="${config.basePrices[1]}"]`);
                
                if (priceElement && planType !== 'free') {
                    const newPrice = config.basePrices[currentPeriod];
                    priceElement.textContent = `${newPrice}₽`;
                }
            });
        }

        // Initial setup
        updateAuthState();
        updatePrices();
