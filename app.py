from functools import wraps

from flask import Flask, request, redirect, render_template, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from datetime import date
from email_validator import validate_email
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost/todolist'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_POOL_RECYCLE'] = 60 # 300
app.config['SECRET_KEY'] = b'Secret_Key'
app.config['DEBUG'] = True

db = SQLAlchemy(app)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    title = db.Column(db.String(100), nullable = False)
    content = db.Column(db.String(200), nullable = True)
    date = db.Column(db.Date, nullable=False, default=date.today)
    status = db.Column(db.Boolean, default = False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable = False)

class User(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    email = db.Column(db.String(100), unique = True, nullable = False)
    password = db.Column(db.String(255), nullable = False)

def login_required(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if 'user_id' in session:
            return f(*args, **kwargs)
        else:
            return redirect('/login')
    return wrap

@app.route('/')
def index():
    return redirect('/login')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')

@app.route('/login-user', methods=['POST'])
def login_user():
    email = request.form['email']
    password = request.form['password']
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({
            'success': False,
            'error': 'User does not exist'
        }), 400

    if not check_password_hash(user.password, password):
        return jsonify({
            'success': False,
            'error': 'Incorrect password'
        }), 400

    session['user_id'] = user.id

    return jsonify({
        'success': True,
        'message': 'Registered successfully.',
        'redirect': '/load-task-list'
    }), 200

@app.route('/register-user', methods=['POST'])
def register_user():
    email = request.form['email']
    password = request.form['password']
    confirm_password = request.form['confirm_password']

    if User.query.filter_by(email=email).first():
        return jsonify({
            'success': False,
            'error': 'Email already registered.'
        }), 400

    if not validate_email(email):
        return jsonify({
            'success': False,
            'error': 'Invalid email address.'
        }), 400

    if len(password) < 6:
        return jsonify({
            'success': False,
            'error': 'Minimum password length 6 characters!'
        }), 400

    if password != confirm_password:
        return jsonify({
            'success': False,
            'error': "Passwords don't match!"
        }), 400

    new_user = User(email=email, password=generate_password_hash(password))

    db.session.add(new_user)
    db.session.commit()

    session['user_id'] = new_user.id

    return jsonify({
        'success': True,
        'message': 'Registered successfully.',
        'redirect': '/load-task-list'
    }), 200

@app.route('/load-task-list')
@login_required
def load_task_list():
    return render_template('task_list.html')

@app.route('/get-tasks', methods=['POST'])
@login_required
def get_tasks():
    data = request.get_json()

    if 'selected_date' not in data:
        return jsonify({
            'success': False,
            'error': 'Invalid date',
            'date': data['selected_date'],
        }, 400)

    selected_date = data['selected_date'][:10]

    tasks_by_selected_date = Task.query.filter(
        Task.date == selected_date,
        Task.user_id == session['user_id']).all()

    tasks_data = [{
        'id': task.id,
        'title': task.title,
        'content': task.content,
        'date': task.date,
        'status': task.status,
    } for task in tasks_by_selected_date]

    return jsonify({
        'success': True,
        'message': 'Tasks got successfully',
        'tasks_data': tasks_data,
    })

@app.route('/create-task', methods = ["POST"])
@login_required
def create_task():
    data = request.form
    new_task = Task(
        title = data['title'],
        content = data['content'],
        date = date.fromisoformat(data['date']),
        user_id = session['user_id']
    )

    db.session.add(new_task)
    db.session.commit()

    return redirect("/load-task-list")

@app.route('/update-task-status', methods = ["POST"])
@login_required
def update_task_status():
    data = request.get_json()

    if 'new_status' not in data:
        return jsonify({
            'success': False,
            'error': 'Invalid status'
        }, 400)

    task = Task.query.get_or_404(data['task_id'])
    task.status = data['new_status']

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Task updated successfully',
        'id': int(data['task_id']),
        'new_status': data['new_status']
    })

if __name__ == '__main__':
    app.run(debug=True)
