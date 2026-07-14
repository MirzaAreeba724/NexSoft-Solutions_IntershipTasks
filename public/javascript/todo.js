// Wait for the DOM window elements to fully load
document.addEventListener("DOMContentLoaded", () => {
    const todoForm = document.getElementById("todo-form");
    const taskInput = document.getElementById("task-input");
    const taskList = document.getElementById("task-list");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const emptyState = document.getElementById("empty-state");

    // Initialize state cache array from localStorage persistence layer
    let tasks = JSON.parse(localStorage.getItem("internship_tasks")) || [];
    let currentFilter = "all";

    // --- Core Sync Functions ---

    // Save state mutation arrays to storage memory
    function saveTasks() {
        localStorage.setItem("internship_tasks", JSON.stringify(tasks));
    }

    // Render operational list view rows based on state filters
    function renderTasks() {
        // Clear active task list view area completely
        taskList.innerHTML = "";

        // Apply chosen filter criteria explicitly
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === "pending") return !task.completed;
            if (currentFilter === "completed") return task.completed;
            return true; // "all" case default execution
        });

        // Manage Empty State warnings UI visibility
        if (filteredTasks.length === 0) {
            emptyState.classList.remove("hidden");
        } else {
            emptyState.classList.add("hidden");
        }

        // Loop through array criteria and append to list wrapper UI
        filteredTasks.forEach(task => {
            const li = document.createElement("li");
            li.className = `task-item ${task.completed ? "completed" : ""}`;
            li.setAttribute("data-id", task.id);

            li.innerHTML = `
                <div class="task-content">
                    <div class="checkbox-ticker"></div>
                    <span class="task-text">${escapeHTML(task.text)}</span>
                </div>
                <button class="delete-btn" title="Remove Task">&times;</button>
            `;

            // Setup Interactive Toggle Event Trigger
            li.querySelector(".task-content").addEventListener("click", (e) => {
                toggleTask(task.id);
            });

            // Setup Delete Trigger Element Node
            li.querySelector(".delete-btn").addEventListener("click", (e) => {
                e.stopPropagation(); // Prevents completion trigger event clash
                deleteTask(task.id);
            });

            taskList.appendChild(li);
        });
    }

    // --- State Mutation Actions ---

    // Create entry handler loops
    todoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (!text) return;

        const newTask = {
            id: Date.now().toString(), // Generates safe custom timestamp node keys
            text: text,
            completed: false
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();

        taskInput.value = ""; // Reset form field input area focus
    });

    // Complete/Pending state toggler
    function toggleTask(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveTasks();
        renderTasks();
    }

    // Delete criteria rows from storage maps
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }

    // --- Filter Operations Management ---
    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            // Swap active button accent styles gracefully
            filterButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            // Pull filter configuration strings and reload layout items
            currentFilter = button.getAttribute("data-filter");
            renderTasks();
        });
    });

    // Simple security encoder to block raw script input injections
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g,
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // Run active view display sequences immediately on first launch loading steps
    renderTasks();
});