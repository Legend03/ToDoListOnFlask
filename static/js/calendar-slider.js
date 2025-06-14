const current_date = new Date()
let selected_date = null
document.querySelector('#taskDate').value = new Date().toISOString().substr(0, 10);

document.addEventListener('DOMContentLoaded', add_event_listener_on_status_button(), update_week_view())

function update_week_view(){
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

        if(is_same_day(date, selected_date || new Date())){
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
    const monday = new Date(date.setDate(diff));
    const weekDates = [];

    for(let i = 0; i < 7; i++){
        const new_date = new Date(monday);

        new_date.setDate(monday.getDate() + i);
        weekDates.push(new_date);
    }

    return weekDates;
}

function load_data_by_date(date) {
    fetch(`/update-task-list`, {
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
            console.log(data['tasks_data'])
            if (data.success) {
                update_week_view(data['tasks_by_selected_date'])
            }

            const root = document.querySelector('.tasks-row')
            root.innerHTML = '';

            data['tasks_data'].forEach((task, index) => {
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

                col_content.classList.add('col-7');
                col_content.textContent = task['content']

                col_status.classList.add('col-1', 'text-center');

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
            })
        })
        .then(() => {
            add_event_listener_on_status_button();
        });
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

function add_event_listener_on_status_button() {
    const all_status_icon = document.querySelectorAll("i");

    all_status_icon.forEach((status_icon) => {
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
                .then(() => {
                        if (status_icon.classList.contains('text-danger')) {
                            status_icon.classList.remove('bi-x-circle-fill', 'text-danger');
                            status_icon.classList.add('bi-check-circle-fill', 'text-success');
                            status_icon.dataset.status = "true";
                        } else {
                            status_icon.classList.remove('bi-check-circle-fill', 'text-success');
                            status_icon.classList.add('bi-x-circle-fill', 'text-danger');
                            status_icon.dataset.status = "false";
                        }
                    }
                )
                .then(() => {
                    update_week_view();
                });
        })
    })
}