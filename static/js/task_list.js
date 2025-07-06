const current_date = new Date()
let selected_date = current_date
let tasks_list = null;

document.addEventListener('DOMContentLoaded', () => {
    load_data_by_date(current_date);
})

document.getElementById('logout').addEventListener('click', () => {
    window.location.href = '/login'
})

function load_data_by_date(date) {
    fetch(`/get-tasks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            selected_date: date
        })
    })
        .then(response => {
            if (!response.ok) throw new Error('Ошибка сервера');
            return response.json();
        })
        .then((data) => {
            tasks_list = data['tasks_data'];

            if (data.success) {
                update_week_view(data['tasks_by_selected_date']);
                render_tasks_list(sort_list_by_status(tasks_list));
                update_diagram(tasks_list);
            }
        })
}

function render_tasks_list(tasks_list) {
    const root = document.querySelector('.tasks-row')
    root.innerHTML = '';

    tasks_list.forEach((task, index) => {
        const row = document.createElement('div');
        const col_index = document.createElement('div');
        const col_title = document.createElement('div');
        const col_content = document.createElement('div');
        const col_status = document.createElement('div');
        const button_status = document.createElement('button');
        const icon_status = document.createElement('i');

        row.classList.add('row', 'task-row');
        row.dataset.id = task['id'];

        col_index.classList.add('col-1', 'index', 'fw-bold', 'text-center');
        col_index.textContent = index + 1;

        col_title.classList.add('col-3');
        col_title.textContent = task['title'];

        col_content.classList.add('col-6');
        col_content.textContent = task['content']

        col_status.classList.add('col-2', 'text-center');

        button_status.classList.add('status-button')

        if (task['status']) {
            icon_status.classList.add('fs-4', 'bi-check-circle-fill', 'text-success')
            icon_status.dataset.status = 'true'
        } else {
            icon_status.classList.add('fs-4', 'bi-x-circle-fill', 'text-danger')
            icon_status.dataset.status = 'false'
        }
        button_status.appendChild(icon_status);
        col_status.appendChild(button_status);
        row.append(col_index, col_title, col_content, col_status);
        root.appendChild(row);

        add_event_listener_on_status_button();
    })
}

function add_event_listener_on_status_button() {
    const all_status_icon = document.querySelectorAll("i");

    all_status_icon.forEach((status_icon, index) => {
        status_icon.addEventListener('click', function (event) {
            const row = this.closest('.row');
            const task_id = row.dataset.id;
            const current_status = status_icon.classList.contains('text-success');
            const new_status = !current_status;

            fetch(`/update-task-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    task_id: task_id,
                    new_status: new_status
                })
            })
                .then(response => {
                    if (!response.ok) throw new Error('Ошибка сервера');
                    return response.json();
                })
                .then((data) => {
                        if (tasks_list[index].id === data.id) {
                            tasks_list[index].status = new_status;
                        }
                        render_tasks_list(sort_list_by_status(tasks_list));
                        update_diagram(tasks_list);
                    }
                )
        })
    })
}

function sort_list_by_status(tasks_list){
    return tasks_list.sort((a, b) => {
        if (a.status !== b.status) return a.status ? 1: -1;
        return a.title.localeCompare(b.title)
    })
}

function update_diagram(tasks){
    const daily_progress = calculate_completion_tasks(tasks);
    const diagram = document.querySelector('.achievement_on_days');

    const circle = diagram.querySelector('.circle');
    const percentage = diagram.querySelector('.percentage');

    circle.style.strokeDasharray = `${daily_progress}, ${100 - daily_progress}`;
    percentage.textContent = `${daily_progress}%`;
}

function calculate_completion_tasks(tasks){
    if (tasks.length === 0) return 0;

    const completed = tasks.filter(task => task.status).length;
    return Math.round((completed / tasks.length) * 100);
}

function update_week_view(){
    document.querySelector('#taskDate').value = selected_date.toISOString().slice(0, 10);

    const week_dates = get_week_dates(current_date);
    const week_dates_container = document.querySelector('.week-dates');
    const current_week_info = document.querySelector('.current-week')

    const first_date = week_dates[0];
    const last_date = week_dates[week_dates.length - 1];

    week_dates_container.innerHTML = '';
    current_week_info.textContent = `${format_date(first_date)} - ${format_date(last_date)}`;

    week_dates.forEach(date => {
        const dateElement = document.createElement('div')
        dateElement.className = 'date'
        dateElement.textContent = date.getDate();

        if(is_same_day(date, selected_date)){
            dateElement.classList.add('selected');
        }

        if(is_same_day(date, new Date())) {
            dateElement.classList.add('today');
        }

        dateElement.addEventListener('click', () => {
            selected_date = date;
            load_data_by_date(date);
        })

        week_dates_container.appendChild(dateElement);
    })
}

function get_week_dates(date){
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);
    const weekDates = [];

    for(let i = 0; i < 7; i++){
        const new_date = new Date(monday);

        new_date.setDate(monday.getDate() + i);
        weekDates.push(new_date);
    }

    return weekDates;
}


document.querySelector('.prev-week').addEventListener('click', () => {
    current_date.setDate(current_date.getDate() - 7);
    update_week_view()
})

document.querySelector('.next-week').addEventListener('click', () => {
    current_date.setDate(current_date.getDate() + 7);
    update_week_view()
})

function is_same_day(day_1, day_2){
    return day_1.getFullYear() === day_2.getFullYear() &&
            day_1.getMonth() === day_2.getMonth() &&
            day_1.getDate() === day_2.getDate();
}

function format_date(date){
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}