// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/admin/login.html';
}

// API headers
const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

// DOM Elements
const userList = document.getElementById('userList');
const userModal = document.getElementById('userModal');
const userForm = document.getElementById('userForm');
const addUserBtn = document.getElementById('addUserBtn');
const cancelBtn = document.getElementById('cancelBtn');
const modalTitle = document.getElementById('modalTitle');
const currentUser = document.getElementById('currentUser');
const logoutBtn = document.getElementById('logoutBtn');

// Get current user
fetch('/api/users/profile', { headers })
    .then(res => res.json())
    .then(user => {
        currentUser.textContent = `${user.username} (${user.role})`;
    })
    .catch(error => {
        console.error('Error fetching profile:', error);
        if (error.status === 401) {
            window.location.href = '/admin/login.html';
        }
    });

// Fetch and display users
function loadUsers() {
    fetch('/api/users', { headers })
        .then(res => res.json())
        .then(users => {
            userList.innerHTML = users.map(user => `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${user.username}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                            user.role === 'operator' ? 'bg-green-100 text-green-800' : 
                            'bg-blue-100 text-blue-800'}">
                            ${user.role}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${user.active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="editUser('${user._id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="toggleUserStatus('${user._id}', ${!user.active})" 
                            class="text-${user.active ? 'red' : 'green'}-600 hover:text-${user.active ? 'red' : 'green'}-900">
                            <i class="fas fa-${user.active ? 'ban' : 'check'}"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(error => {
            console.error('Error loading users:', error);
            if (error.status === 401) {
                window.location.href = '/admin/login.html';
            }
        });
}

// Show modal for adding/editing user
function showModal(title = 'Add New User') {
    modalTitle.textContent = title;
    userModal.classList.remove('hidden');
    userForm.reset();
}

// Hide modal
function hideModal() {
    userModal.classList.add('hidden');
    userForm.reset();
}

// Edit user
function editUser(userId) {
    fetch(`/api/users/${userId}`, { headers })
        .then(res => res.json())
        .then(user => {
            document.getElementById('username').value = user.username;
            document.getElementById('role').value = user.role;
            userForm.dataset.userId = userId;
            showModal('Edit User');
        })
        .catch(console.error);
}

// Toggle user status
function toggleUserStatus(userId, active) {
    fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ active })
    })
        .then(() => loadUsers())
        .catch(console.error);
}

// Event Listeners
addUserBtn.addEventListener('click', () => showModal());
cancelBtn.addEventListener('click', hideModal);
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/admin/login.html';
});

userForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userId = userForm.dataset.userId;
    const data = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
    };

    fetch(`/api/users${userId ? `/${userId}` : ''}`, {
        method: userId ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(data)
    })
        .then(() => {
            hideModal();
            loadUsers();
        })
        .catch(console.error);
});

// Initial load
loadUsers();
