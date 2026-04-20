let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let draggedTaskId = null;

// Initialize the app
function init() {
    renderTasks();
    updateDeadlineCounts();
    renderCalendar();
    renderPlanner();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', renderTasks);
}

// Tab switching
function switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update active content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Refresh the view
    if (tabName === 'deadlines') {
        updateDeadlineCounts();
        renderDeadlineTasks();
    } else if (tabName === 'calendar') {
        renderCalendar();
    } else if (tabName === 'planner') {
        renderPlanner();
    }
}

// Save to localStorage
function updateStorage() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Show task form
function showTaskForm(task = null) {
    const modal = document.getElementById('taskModal');
    const title = document.getElementById('modalTitle');
    
    if (task) {
        title.textContent = 'Edit Task';
        fillTaskForm(task);
    } else {
        title.textContent = 'Create New Task';
        resetTaskForm();
    }
    
    modal.style.display = 'block';
}

// Close task form
function closeTaskForm() {
    document.getElementById('taskModal').style.display = 'none';
}

// Fill task form for editing
function fillTaskForm(task) {
    document.getElementById('taskId').value = task.id;
    document.getElementById('title').value = task.title;
    document.getElementById('description').value = task.description;
    document.getElementById('dueDate').value = task.dueDate;
    document.getElementById('priority').value = task.priority;
    document.getElementById('category').value = task.category;
    document.getElementById('status').value = task.status;
}

// Reset task form
function resetTaskForm() {
    document.getElementById('taskId').value = '';
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    document.getElementById('dueDate').value = '';
    document.getElementById('priority').value = 'Low';
    document.getElementById('category').value = '';
    document.getElementById('status').value = 'To Do';
}

// Save task
function saveTask(event) {
    event.preventDefault();
    
    let id = document.getElementById('taskId').value;
    let task = {
        id: id ? Number(id) : Date.now(),
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        dueDate: document.getElementById('dueDate').value,
        priority: document.getElementById('priority').value,
        category: document.getElementById('category').value,
        status: document.getElementById('status').value
    };

    if (id) {
        // Update existing task
        let index = tasks.findIndex(t => t.id == id);
        tasks[index] = task;
        showMessage('Task updated successfully!', 'success');
    } else {
        // Add new task
        tasks.push(task);
        showMessage('Task created successfully!', 'success');
    }

    updateStorage();
    renderTasks();
    updateDeadlineCounts();
    renderCalendar();
    renderPlanner();
    closeTaskForm();
}

// Edit task
function editTask(id) {
    let task = tasks.find(t => t.id == id);
    showTaskForm(task);
    showMessage('You can edit the task above now', 'info');
}

// Delete task
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id != id);
        updateStorage();
        renderTasks();
        updateDeadlineCounts();
        renderCalendar();
        renderPlanner();
        showMessage('Task deleted successfully!', 'success');
    }
}

// Drag and Drop
function dragStart(id) {
    draggedTaskId = id;
}

function allowDrop(event) {
    event.preventDefault();
}

function dropTaskPlanner(event) {
    event.preventDefault();
    if (!draggedTaskId) return;

    const status = event.currentTarget.id.replace('Tasks', '').replace(/([A-Z])/g, ' $1').trim();
    const taskIndex = tasks.findIndex(t => t.id == draggedTaskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex].status = status;
        updateStorage();
        renderPlanner();
        renderTasks();
        showMessage(`Task moved to ${status}`, 'success');
    }
    
    draggedTaskId = null;
}

// Render tasks
function renderTasks() {
    const list = document.getElementById('taskList');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const priorityFilter = document.getElementById('filterPriority').value;
    const categoryFilter = document.getElementById('filterCategory').value.toLowerCase();

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
                            task.description.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        const matchesCategory = task.category.toLowerCase().includes(categoryFilter);

        return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });

    list.innerHTML = '';

    if (filteredTasks.length === 0) {
        list.innerHTML = '<div class="no-tasks">No tasks found. Create your first task!</div>';
        return;
    }

    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        list.appendChild(taskElement);
    });
}

// Create task element
function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task';
    div.draggable = true;
    div.ondragstart = () => dragStart(task.id);

    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline';
    
    div.innerHTML = `
        <div class="task-header">
            <h3 class="task-title">${task.title}</h3>
            <span class="task-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>
        </div>
        <div class="task-meta">
            <div class="task-meta-item">
                <i class="fas fa-calendar"></i>
                <span>${dueDate}</span>
            </div>
            <div class="task-meta-item">
                <i class="fas fa-tag"></i>
                <span>${task.category || 'Uncategorized'}</span>
            </div>
            <div class="task-meta-item">
                <i class="fas fa-circle"></i>
                <span>${task.status}</span>
            </div>
        </div>
        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
        <div class="task-footer">
            <span class="task-category">${task.category || 'General'}</span>
            <div class="task-actions">
                <button class="btn-edit" onclick="editTask(${task.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-delete" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;

    return div;
}

// Update deadline counts
function updateDeadlineCounts() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    const startOfNextWeek = new Date(endOfWeek);
    startOfNextWeek.setDate(endOfWeek.getDate() + 1);
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);

    let overdue = 0, dueToday = 0, dueThisWeek = 0, dueNextWeek = 0, completed = 0;

    tasks.forEach(task => {
        if (task.status === 'Completed') {
            completed++;
            return;
        }

        if (!task.dueDate) return;

        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) {
            overdue++;
        } else if (dueDate.getTime() === today.getTime()) {
            dueToday++;
        } else if (dueDate <= endOfWeek) {
            dueThisWeek++;
        } else if (dueDate >= startOfNextWeek && dueDate <= endOfNextWeek) {
            dueNextWeek++;
        }
    });

    document.getElementById('overdueCount').textContent = overdue;
    document.getElementById('todayCount').textContent = dueToday;
    document.getElementById('weekCount').textContent = dueThisWeek;
    document.getElementById('nextWeekCount').textContent = dueNextWeek;
    document.getElementById('completedCount').textContent = completed;
}

// Render deadline tasks
function renderDeadlineTasks() {
    const container = document.getElementById('deadlineTasks');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const overdueTasks = tasks.filter(task => {
        if (!task.dueDate || task.status === 'Completed') return false;
        const dueDate = new Date(task.dueDate);
        return dueDate < today;
    });

    container.innerHTML = '';

    if (overdueTasks.length === 0) {
        container.innerHTML = '<div class="no-tasks">No overdue tasks. Great job!</div>';
        return;
    }

    overdueTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        container.appendChild(taskElement);
    });
}

// Calendar functions - FIXED
function renderCalendar() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Previous month days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = 0; i < startingDay; i++) {
        const day = prevMonthLastDay - startingDay + i + 1;
        const prevDate = new Date(currentYear, currentMonth - 1, day);
        const dayElement = createCalendarDay(day, true, false, prevDate);
        calendarGrid.appendChild(dayElement);
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const isToday = date.getDate() === today.getDate() && 
                       date.getMonth() === today.getMonth() && 
                       date.getFullYear() === today.getFullYear();

        const dayElement = createCalendarDay(day, false, isToday, date);
        calendarGrid.appendChild(dayElement);
    }

    // Next month days
    const totalCells = 42; // 6 weeks * 7 days
    const remainingCells = totalCells - (startingDay + totalDays);
    for (let day = 1; day <= remainingCells; day++) {
        const nextDate = new Date(currentYear, currentMonth + 1, day);
        const dayElement = createCalendarDay(day, true, false, nextDate);
        calendarGrid.appendChild(dayElement);
    }
}

function createCalendarDay(day, isOtherMonth, isToday = false, date = null) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (isOtherMonth) dayElement.classList.add('other-month');
    if (isToday) dayElement.classList.add('today');
    
    // Get tasks for this date
    let dayTasks = [];
    if (date) {
        dayTasks = tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate.getDate() === date.getDate() && 
                   taskDate.getMonth() === date.getMonth() && 
                   taskDate.getFullYear() === date.getFullYear();
        });
        
        if (dayTasks.length > 0) {
            dayElement.classList.add('has-tasks');
            if (dayTasks.length > 2) {
                dayElement.classList.add('multiple-tasks');
            }
        }
    }
    
    dayElement.innerHTML = `
        <div class="day-number">${day}</div>
        ${date ? `<div class="calendar-tasks-list" id="tasks-${date.toISOString().split('T')[0]}"></div>` : ''}
        ${dayTasks.length > 2 ? `<div class="task-count-badge">+${dayTasks.length - 2}</div>` : ''}
    `;

    if (date) {
        dayElement.onclick = () => {
            const dayTasks = tasks.filter(task => {
                if (!task.dueDate) return false;
                const taskDate = new Date(task.dueDate);
                return taskDate.getDate() === date.getDate() && 
                       taskDate.getMonth() === date.getMonth() && 
                       taskDate.getFullYear() === date.getFullYear();
            });
            
            if (dayTasks.length > 0) {
                showDateTasks(date);
            } else {
                showCalendarTaskForm(date);
            }
        };
        
        // Render tasks for this date
        if (dayTasks.length > 0) {
            renderCalendarTasks(date, dayTasks);
        }
    }

    return dayElement;
}

function renderCalendarTasks(date, tasksForDate) {
    const containerId = `tasks-${date.toISOString().split('T')[0]}`;
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Show only first 2 tasks, rest will be indicated by badge
    const tasksToShow = tasksForDate.slice(0, 2);
    
    container.innerHTML = '';
    
    tasksToShow.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `calendar-task-item priority-${task.priority.toLowerCase()}`;
        taskElement.textContent = task.title;
        taskElement.title = `${task.title} - ${task.priority} Priority`;
        taskElement.onclick = (e) => {
            e.stopPropagation(); // Prevent date click
            editTask(task.id);
        };
        container.appendChild(taskElement);
    });
}

function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

// Show all tasks for a specific date
function showDateTasks(date) {
    const dateTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.getDate() === date.getDate() && 
               taskDate.getMonth() === date.getMonth() && 
               taskDate.getFullYear() === date.getFullYear();
    });
    
    // Create a modal to show all tasks for this date
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>Tasks for ${date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</h2>
                <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
            </div>
            <div class="task-list" style="max-height: 400px; overflow-y: auto; padding: 1rem;">
                ${dateTasks.length === 0 ? '<div class="no-tasks">No tasks for this date</div>' : ''}
                ${dateTasks.map(task => `
                    <div class="task" style="margin-bottom: 0.5rem;">
                        <div class="task-header">
                            <h4 class="task-title">${task.title}</h4>
                            <span class="task-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>
                        </div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                        <div class="task-actions">
                            <button class="btn-edit" onclick="editTask(${task.id}); this.closest('.modal').remove();">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn-delete" onclick="deleteTask(${task.id}); this.closest('.modal').remove();">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="form-actions">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                <button class="btn-primary" onclick="showCalendarTaskForm(new Date('${date.toISOString()}')); this.closest('.modal').remove();">Add New Task</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Calendar task form
function showCalendarTaskForm(date) {
    const modal = document.getElementById('calendarTaskModal');
    const selectedDate = document.getElementById('selectedDate');
    
    selectedDate.textContent = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    document.getElementById('calendarDueDate').value = date.toISOString().split('T')[0];
    document.getElementById('calendarTitle').value = '';
    document.getElementById('calendarDescription').value = '';
    document.getElementById('calendarPriority').value = 'Medium';
    document.getElementById('calendarCategory').value = '';
    
    modal.style.display = 'block';
}

function closeCalendarTaskForm() {
    document.getElementById('calendarTaskModal').style.display = 'none';
}

function saveCalendarTask(event) {
    event.preventDefault();
    
    const task = {
        id: Date.now(),
        title: document.getElementById('calendarTitle').value,
        description: document.getElementById('calendarDescription').value,
        dueDate: document.getElementById('calendarDueDate').value,
        priority: document.getElementById('calendarPriority').value,
        category: document.getElementById('calendarCategory').value,
        status: 'To Do'
    };

    tasks.push(task);
    updateStorage();
    renderTasks();
    updateDeadlineCounts();
    renderCalendar();
    renderPlanner();
    closeCalendarTaskForm();
    showMessage('Task added successfully!', 'success');
}

// Planner view
function renderPlanner() {
    renderPlannerColumn('todoTasks', 'To Do');
    renderPlannerColumn('inProgressTasks', 'In Progress');
    renderPlannerColumn('completedTasks', 'Completed');
}

function renderPlannerColumn(columnId, status) {
    const column = document.getElementById(columnId);
    const columnTasks = tasks.filter(task => task.status === status);
    
    column.innerHTML = '';
    
    if (columnTasks.length === 0) {
        column.innerHTML = '<div class="no-tasks">No tasks</div>';
        return;
    }
    
    columnTasks.forEach(task => {
        const taskElement = createPlannerTaskElement(task);
        column.appendChild(taskElement);
    });
}

function createPlannerTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task';
    div.draggable = true;
    div.ondragstart = () => dragStart(task.id);
    
    div.innerHTML = `
        <div class="task-header">
            <h4 class="task-title">${task.title}</h4>
            <span class="task-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>
        </div>
        ${task.dueDate ? `<div class="task-meta-item">
            <i class="fas fa-calendar"></i>
            <span>${new Date(task.dueDate).toLocaleDateString()}</span>
        </div>` : ''}
        ${task.category ? `<div class="task-category">${task.category}</div>` : ''}
    `;
    
    return div;
}

// Utility functions
function showMessage(message, type) {
    // Remove existing message if any
    const existingMessage = document.getElementById('messageBox');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageBox = document.createElement('div');
    messageBox.id = 'messageBox';
    messageBox.textContent = message;
    messageBox.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 20px 30px;
        background: ${type === 'info' ? '#3498db' : type === 'success' ? '#2ecc71' : '#e74c3c'};
        color: white;
        border-radius: 8px;
        z-index: 1002;
        font-weight: bold;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        text-align: center;
        animation: fadeIn 0.3s ease-in;
    `;
    
    document.body.appendChild(messageBox);
    
    setTimeout(() => {
        if (messageBox.parentNode) {
            messageBox.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (messageBox.parentNode) {
                    messageBox.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);