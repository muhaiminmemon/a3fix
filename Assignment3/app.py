from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import os
from datetime import datetime

app = Flask(__name__, 
            static_url_path='/static',
            static_folder='static',
            template_folder='templates')
            
app.config['SECRET_KEY'] = 'cscb20-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///assignment3.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    
    marks = db.relationship('Mark', backref='student', lazy=True)
    remark_requests = db.relationship('RemarkRequest', backref='student', lazy=True)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Assignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False) 
    max_mark = db.Column(db.Float, nullable=False)
    
    marks = db.relationship('Mark', backref='assignment', lazy=True)
    remark_requests = db.relationship('RemarkRequest', backref='assignment', lazy=True)
    
    def __repr__(self):
        return f'<Assignment {self.name}>'

class Mark(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assignment_id = db.Column(db.Integer, db.ForeignKey('assignment.id'), nullable=False)
    mark = db.Column(db.Float, nullable=False)
    
    def __repr__(self):
        return f'<Mark {self.student_id} {self.assignment_id} {self.mark}>'

class RemarkRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assignment_id = db.Column(db.Integer, db.ForeignKey('assignment.id'), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending')  
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<RemarkRequest {self.id}>'

class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    instructor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    teaching_feedback = db.Column(db.Text, nullable=False)
    teaching_improvement = db.Column(db.Text, nullable=False)
    lab_feedback = db.Column(db.Text, nullable=False)
    lab_improvement = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed = db.Column(db.Boolean, default=False)
    
    def __repr__(self):
        return f'<Feedback {self.id}>'

def login_required(route_function):
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page', 'info')
            return redirect(url_for('login'))
        return route_function(*args, **kwargs)
    
    wrapper.__name__ = route_function.__name__
    return wrapper

@app.route('/')
def home():
    if 'user_id' not in session:
        return render_template('landing.html')
    return render_template('index.html')

@app.route('/lectures')
@login_required
def lectures():
    return render_template('lectures.html')

@app.route('/assignments')
@login_required
def assignments():
    return render_template('assignments.html')

@app.route('/syllabus')
@login_required
def syllabus():
    return render_template('syllabus.html')

@app.route('/labs')
@login_required
def labs():
    return render_template('labs.html')

@app.route('/calendar')
@login_required
def calendar():
    return render_template('calendar.html')

@app.route('/team')
@login_required
def team():
    return render_template('team.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and bcrypt.check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['username'] = user.username
            session['role'] = user.role
            session['name'] = user.name
            
            if user.role == 'student':
                return redirect(url_for('student_dashboard'))
            else:
                return redirect(url_for('instructor_dashboard'))
        else:
            flash('Invalid username or password. Please try again.', 'error')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        name = request.form.get('name')
        role = request.form.get('role')
        
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            flash('Username already exists. Please choose another one.', 'error')
            return redirect(url_for('register'))
        
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(username=username, password=hashed_password, name=name, role=role)
        
        db.session.add(new_user)
        db.session.commit()
        
        flash('Registration successful! You can now log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

@app.route('/feedback', methods=['GET', 'POST'])
@login_required
def feedback():
    instructors = User.query.filter_by(role='instructor').all()
    
    if request.method == 'POST':
        instructor_id = request.form.get('instructor_id')
        teaching_feedback = request.form.get('teaching_feedback')
        teaching_improvement = request.form.get('teaching_improvement')
        lab_feedback = request.form.get('lab_feedback')
        lab_improvement = request.form.get('lab_improvement')
        
        if not all([instructor_id, teaching_feedback, teaching_improvement, lab_feedback, lab_improvement]):
            flash('Please fill out all fields in the feedback form.', 'error')
            return redirect(url_for('feedback'))
        
        try:
            instructor_id = int(instructor_id)
            
            new_feedback = Feedback(
                instructor_id=instructor_id,
                teaching_feedback=teaching_feedback,
                teaching_improvement=teaching_improvement,
                lab_feedback=lab_feedback,
                lab_improvement=lab_improvement
            )
            
            db.session.add(new_feedback)
            db.session.commit()
            
            flash('Your feedback has been submitted successfully! It will be reviewed by the instructor.', 'success')
            return redirect(url_for('feedback'))
        except Exception as e:
            db.session.rollback()
            flash(f'An error occurred while submitting your feedback: {str(e)}', 'error')
            return redirect(url_for('feedback'))
    
    return render_template('feedback.html', instructors=instructors)

@app.route('/students/dashboard')
@login_required
def student_dashboard():
    if session['role'] != 'student':
        flash('Please log in as a student to access this page.', 'error')
        return redirect(url_for('login'))
    
    return render_template('students/dashboard.html')

@app.route('/students/marks')
@login_required
def student_marks():
    if session['role'] != 'student':
        flash('Please log in as a student to access this page.', 'error')
        return redirect(url_for('login'))
    
    student_id = session['user_id']
    marks = Mark.query.filter_by(student_id=student_id).all()
    
    marks_by_type = {
        'assignments': [],
        'labs': [],
        'midterm': [],
        'final': []
    }
    
    for mark in marks:
        assignment = Assignment.query.get(mark.assignment_id)
        remark_request = RemarkRequest.query.filter_by(
            student_id=student_id, 
            assignment_id=mark.assignment_id
        ).first()
        
        mark_info = {
            'id': mark.id,
            'assignment_id': assignment.id,
            'name': assignment.name,
            'mark': mark.mark,
            'max_mark': assignment.max_mark,
            'percentage': (mark.mark / assignment.max_mark) * 100,
            'has_remark_request': remark_request is not None,
            'remark_status': remark_request.status if remark_request else None
        }
        
        if assignment.type == 'assignment':
            marks_by_type['assignments'].append(mark_info)
        elif assignment.type == 'lab':
            marks_by_type['labs'].append(mark_info)
        elif assignment.type == 'midterm':
            marks_by_type['midterm'].append(mark_info)
        elif assignment.type == 'final':
            marks_by_type['final'].append(mark_info)
    
    return render_template('students/marks.html', marks_by_type=marks_by_type)

@app.route('/students/remark', methods=['POST'])
@login_required
def submit_remark_request():
    if session['role'] != 'student':
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': 'Authentication required'})
        return redirect(url_for('login'))
    
    student_id = session['user_id']
    assignment_id = request.form.get('assignment_id')
    reason = request.form.get('reason')
    
    existing_request = RemarkRequest.query.filter_by(
        student_id=student_id,
        assignment_id=assignment_id
    ).first()
    
    if existing_request:
        message = 'You have already submitted a remark request for this assignment.'
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': message})
        flash(message, 'error')
    else:
        new_request = RemarkRequest(
            student_id=student_id,
            assignment_id=assignment_id,
            reason=reason,
            status='pending'
        )
        
        db.session.add(new_request)
        db.session.commit()
        
        message = 'Remark request submitted successfully!'
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': True, 'message': message})
        flash(message, 'success')
    
    return redirect(url_for('student_marks'))

@app.route('/instructor/dashboard')
@login_required
def instructor_dashboard():
    if session['role'] != 'instructor':
        flash('Please log in as an instructor to access this page.', 'error')
        return redirect(url_for('login'))
    
    return render_template('instructor/dashboard.html')

@app.route('/instructor/marks')
@login_required
def instructor_marks():
    if session['role'] != 'instructor':
        flash('Please log in as an instructor to access this page.', 'error')
        return redirect(url_for('login'))
    
    students = User.query.filter_by(role='student').all()
    assignments = Assignment.query.all()
    
    student_marks = []
    
    for student in students:
        marks = Mark.query.filter_by(student_id=student.id).all()
        mark_dict = {'student': student, 'marks': {}}
        
        for mark in marks:
            assignment = Assignment.query.get(mark.assignment_id)
            mark_dict['marks'][assignment.id] = {
                'mark': mark.mark,
                'max_mark': assignment.max_mark,
                'percentage': (mark.mark / assignment.max_mark) * 100
            }
        
        student_marks.append(mark_dict)
    
    return render_template('instructor/marks.html', student_marks=student_marks, assignments=assignments)

@app.route('/instructor/enter-marks', methods=['GET', 'POST'])
@login_required
def enter_marks():
    if session['role'] != 'instructor':
        flash('Please log in as an instructor to access this page.', 'error')
        return redirect(url_for('login'))
    
    students = User.query.filter_by(role='student').all()
    assignments = Assignment.query.all()
    
    if request.method == 'POST':
        student_id = request.form.get('student_id')
        assignment_id = request.form.get('assignment_id')
        mark = float(request.form.get('mark'))
        
        existing_mark = Mark.query.filter_by(
            student_id=student_id,
            assignment_id=assignment_id
        ).first()
        
        if existing_mark:
            existing_mark.mark = mark
        else:
            new_mark = Mark(
                student_id=student_id,
                assignment_id=assignment_id,
                mark=mark
            )
            db.session.add(new_mark)
        
        db.session.commit()
        
        flash('Marks updated successfully!', 'success')
        return redirect(url_for('enter_marks'))
    
    return render_template('instructor/enter_marks.html', students=students, assignments=assignments)

@app.route('/instructor/remark-requests')
@login_required
def view_remark_requests():
    if session['role'] != 'instructor':
        flash('Please log in as an instructor to access this page.', 'error')
        return redirect(url_for('login'))
    
    remark_requests = RemarkRequest.query.all()
    
    requests_data = []
    
    for request in remark_requests:
        student = User.query.get(request.student_id)
        assignment = Assignment.query.get(request.assignment_id)
        mark = Mark.query.filter_by(
            student_id=request.student_id,
            assignment_id=request.assignment_id
        ).first()
        
        request_data = {
            'id': request.id,
            'student_name': student.name,
            'assignment_name': assignment.name,
            'mark': mark.mark if mark else 'N/A',
            'max_mark': assignment.max_mark,
            'reason': request.reason,
            'status': request.status,
            'created_at': request.created_at
        }
        
        requests_data.append(request_data)
    
    return render_template('instructor/remark_requests.html', requests=requests_data)

@app.route('/instructor/update-remark/<int:request_id>', methods=['POST'])
@login_required
def update_remark_request(request_id):
    if session['role'] != 'instructor':
        flash('Please log in as an instructor to access this page.', 'error')
        return redirect(url_for('login'))
    
    status = request.form.get('status')
    
    remark_request = RemarkRequest.query.get(request_id)
    if not remark_request:
        flash('Remark request not found.', 'error')
        return redirect(url_for('view_remark_requests'))
        
    remark_request.status = status
    
    db.session.commit()
    
    flash('Remark request updated successfully!', 'success')
    return redirect(url_for('view_remark_requests'))

@app.route('/instructor/view-feedback')
@login_required
def view_feedback():
    if session['role'] != 'instructor':
        flash('Please log in as an instructor to access this page.', 'error')
        return redirect(url_for('login'))
    
    instructor_id = session['user_id']
    
    feedback = Feedback.query.filter_by(instructor_id=instructor_id).order_by(Feedback.created_at.desc()).all()
    
    return render_template('instructor/feedback.html', feedback=feedback)

@app.route('/instructor/mark-feedback-reviewed/<int:feedback_id>', methods=['POST'])
@login_required
def mark_feedback_reviewed(feedback_id):
    if session['role'] != 'instructor':
        flash('Please log in as an instructor to access this page.', 'error')
        return redirect(url_for('login'))
    
    instructor_id = session['user_id']
    
    feedback = Feedback.query.filter_by(id=feedback_id, instructor_id=instructor_id).first()
    
    if not feedback:
        flash('Feedback not found or you are not authorized to review it.', 'error')
        return redirect(url_for('view_feedback'))
    
    feedback.reviewed = True
    db.session.commit()
    
    flash('Feedback marked as reviewed!', 'success')
    return redirect(url_for('view_feedback'))

@app.route('/submit-remark', methods=['POST'])
@login_required
def submit_remark():
    if session['role'] != 'student':
        return jsonify({'success': False, 'message': 'Only students can submit remark requests'})
    
    data = request.get_json()
    assignment_id = data.get('assignment_id')
    reason = data.get('reason')
    
    if not assignment_id or not reason:
        return jsonify({'success': False, 'message': 'Missing required fields'})
    
    existing_request = RemarkRequest.query.filter_by(
        student_id=session['user_id'],
        assignment_id=assignment_id
    ).first()
    
    if existing_request:
        return jsonify({'success': False, 'message': 'You have already submitted a remark request for this assignment'})
    
    new_request = RemarkRequest(
        student_id=session['user_id'],
        assignment_id=assignment_id,
        reason=reason,
        status='pending'
    )
    
    try:
        db.session.add(new_request)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Remark request submitted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})

@app.route('/submit-feedback', methods=['POST'])
@login_required
def submit_feedback():
    if session['role'] != 'student':
        return jsonify({'success': False, 'message': 'Only students can submit feedback'})
    
    data = request.get_json()
    instructor_id = data.get('instructor_id')
    teaching_feedback = data.get('teaching_feedback')
    teaching_improvement = data.get('teaching_improvement')
    lab_feedback = data.get('lab_feedback')
    lab_improvement = data.get('lab_improvement')
    
    if not all([instructor_id, teaching_feedback, teaching_improvement, lab_feedback, lab_improvement]):
        return jsonify({'success': False, 'message': 'Missing required fields'})
    
    new_feedback = Feedback(
        instructor_id=instructor_id,
        teaching_feedback=teaching_feedback,
        teaching_improvement=teaching_improvement,
        lab_feedback=lab_feedback,
        lab_improvement=lab_improvement
    )
    
    try:
        db.session.add(new_feedback)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Feedback submitted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})

@app.route('/update-mark', methods=['POST'])
@login_required
def update_mark():
    if session['role'] != 'instructor':
        return jsonify({'success': False, 'message': 'Only instructors can update marks'})
    
    data = request.get_json()
    student_id = data.get('student_id')
    assignment_id = data.get('assignment_id')
    mark = data.get('mark')
    
    if not all([student_id, assignment_id, mark]):
        return jsonify({'success': False, 'message': 'Missing required fields'})
    
    try:
        mark = float(mark)
        if mark < 0:
            return jsonify({'success': False, 'message': 'Mark cannot be negative'})
    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid mark value'})
    
    existing_mark = Mark.query.filter_by(
        student_id=student_id,
        assignment_id=assignment_id
    ).first()
    
    if existing_mark:
        existing_mark.mark = mark
    else:
        new_mark = Mark(
            student_id=student_id,
            assignment_id=assignment_id,
            mark=mark
        )
        db.session.add(new_mark)
    
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': 'Mark updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})

@app.route('/update-remark-status', methods=['POST'])
@login_required
def update_remark_status():
    if session['role'] != 'instructor':
        return jsonify({'success': False, 'message': 'Only instructors can update remark status'})
    
    data = request.get_json()
    request_id = data.get('request_id')
    status = data.get('status')
    
    if not all([request_id, status]):
        return jsonify({'success': False, 'message': 'Missing required fields'})
    
    if status not in ['pending', 'approved', 'rejected']:
        return jsonify({'success': False, 'message': 'Invalid status'})
    
    remark_request = RemarkRequest.query.get(request_id)
    if not remark_request:
        return jsonify({'success': False, 'message': 'Remark request not found'})
  
    remark_request.status = status
    
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': 'Remark status updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})

@app.route('/mark-feedback-reviewed', methods=['POST'])
@login_required
def mark_feedback_reviewed_dynamic():
    if session['role'] != 'instructor':
        return jsonify({'success': False, 'message': 'Only instructors can mark feedback as reviewed'})
    
    data = request.get_json()
    feedback_id = data.get('feedback_id')
    
    if not feedback_id:
        return jsonify({'success': False, 'message': 'Missing feedback ID'})
    
    feedback = Feedback.query.get(feedback_id)
    if not feedback:
        return jsonify({'success': False, 'message': 'Feedback not found'})
    
    if feedback.instructor_id != session['user_id']:
        return jsonify({'success': False, 'message': 'You can only mark your own feedback as reviewed'})
    
    feedback.reviewed = True
    
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': 'Feedback marked as reviewed'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        if not User.query.filter_by(username='student1').first():
            db.session.add(User(
                username='student1',
                password=bcrypt.generate_password_hash('student1').decode('utf-8'),
                name='Student One',
                role='student'
            ))
        
        if not User.query.filter_by(username='student2').first():
            db.session.add(User(
                username='student2',
                password=bcrypt.generate_password_hash('student2').decode('utf-8'),
                name='Student Two',
                role='student'
            ))
        
        if not User.query.filter_by(username='instructor1').first():
            db.session.add(User(
                username='instructor1',
                password=bcrypt.generate_password_hash('instructor1').decode('utf-8'),
                name='Instructor One',
                role='instructor'
            ))
        
        if not User.query.filter_by(username='instructor2').first():
            db.session.add(User(
                username='instructor2',
                password=bcrypt.generate_password_hash('instructor2').decode('utf-8'),
                name='Instructor Two',
                role='instructor'
            ))
        
        if not Assignment.query.filter_by(name='Assignment 1').first():
            db.session.add(Assignment(
                name='Assignment 1',
                type='assignment',
                max_mark=100
            ))
        
        if not Assignment.query.filter_by(name='Assignment 2').first():
            db.session.add(Assignment(
                name='Assignment 2',
                type='assignment',
                max_mark=100
            ))
        
        if not Assignment.query.filter_by(name='Lab 1').first():
            db.session.add(Assignment(
                name='Lab 1',
                type='lab',
                max_mark=10
            ))
        
        if not Assignment.query.filter_by(name='Lab 2').first():
            db.session.add(Assignment(
                name='Lab 2',
                type='lab',
                max_mark=10
            ))
        
        if not Assignment.query.filter_by(name='Midterm').first():
            db.session.add(Assignment(
                name='Midterm',
                type='midterm',
                max_mark=100
            ))
        
        if not Assignment.query.filter_by(name='Final Exam').first():
            db.session.add(Assignment(
                name='Final Exam',
                type='final',
                max_mark=100
            ))
        
        db.session.commit()
    
    app.run(debug=True)