const all_status_icon = document.querySelectorAll("i");

all_status_icon.forEach((status_icon)=>{
    status_icon.addEventListener('click', function (event){
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
            .then(()=>{
                window.location.reload();
            });
    })
})