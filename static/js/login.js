const form = document.querySelector('form');

form.addEventListener('submit', (e) => {
    e.preventDefault()

    if(!validate_form()){
        return;
    }

    const form_data = new FormData(form)

    fetch('login-user', {
        method: 'POST',
        body: form_data
    }).then(response => {
        return response.json()
    }).then(data => {
        if(data.success){
            window.location.href = data.redirect;
        }
        else{
            show_error(data.error);
        }
    })
});

function validate_form(){
    const email = document.getElementById('email').value;

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
        show_error('Invalid email!')
        return false
    }

    return true
}

function show_error(error_message){
    const block_error = document.getElementById('error');

    block_error.textContent = error_message;
    block_error.style.visibility = 'visible';
}