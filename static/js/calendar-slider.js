const current_date = new Date()
let selected_date = null

update_week_view();

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
            update_week_view();
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

console.log(get_week_dates(current_date))