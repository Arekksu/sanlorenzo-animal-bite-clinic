from flask import Flask, render_template 

app = Flask(__name__)

@app.route('/')
def home():
    return "Welcome to the Animal Bite Clinic System"


@app.route('/employee-login')
def employee_login():
    return render_template('employee-login.html')

@app.route('/employee-dashboard')
def employee_dashboard():
    return render_template('employee-dashboard.html')

if  __name__ == "__main__":
    app.run(debug=True)
    