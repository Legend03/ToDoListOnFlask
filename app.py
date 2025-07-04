from flask import Flask, request, redirect, render_template, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import date

DATE_FORMAT = "%Y-%m-%d"

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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get-tasks', methods=['POST'])
def get_tasks():
    data = request.get_json()

    if 'selected_date' not in data:
        return jsonify({
            'success': False,
            'error': 'Invalid date',
            'date': data['selected_date'],
        }, 400)

    selected_date = data['selected_date'][:10]

    tasks_by_selected_date = Task.query.filter(Task.date == selected_date).all()

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
def create_task():
    data = request.form
    new_task = Task(
        title = data['title'],
        content = data['content'],
        date = date.fromisoformat(data['date']),
    )

    db.session.add(new_task)
    db.session.commit()

    return redirect("/")

@app.route('/update-task-status', methods = ["POST"])
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
