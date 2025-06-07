from flask import Flask, request, redirect, render_template, jsonify
from flask_sqlalchemy import SQLAlchemy

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
    status = db.Column(db.Boolean, default = False)

@app.route('/')
def index():
    all_tasks = Task.query.order_by(Task.status, Task.title).all()
    return render_template('index.html', all_tasks = all_tasks)

@app.route('/create-task', methods = ["POST"])
def create_task():
    data = request.form
    new_task = Task(
        title = data['title'],
        content = data['content'],
    )

    db.session.add(new_task)
    db.session.commit()

    return redirect("/")

@app.route('/update-task-status', methods = ["POST"])
def update_task_status():
    data = request.get_json()

    if data['new_status'] in data:
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
        'task_id': data['task_id'],
        'new_status': data['new_status']
    })


if __name__ == '__main__':
    app.run(debug=True)
