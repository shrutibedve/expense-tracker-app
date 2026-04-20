from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import pandas as pd
import os
from fpdf import FPDF
from datetime import datetime

app = Flask(__name__)
CORS(app)

CSV_FILE = 'data/expenses.csv'

def load_data():
    if os.path.exists(CSV_FILE):
        df = pd.read_csv(CSV_FILE)
        # Fill NaN so JSON serialization never produces invalid output
        df = df.fillna('')
        return df
    return pd.DataFrame(columns=['Date', 'Category', 'Amount', 'Description', 'Type'])

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    df = load_data()
    # Convert amounts to float safely
    df['Amount'] = pd.to_numeric(df['Amount'], errors='coerce').fillna(0)
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/expenses', methods=['POST'])
def add_expense():
    new_data = request.json
    df = load_data()
    new_row = pd.DataFrame([new_data])
    df = pd.concat([df, new_row], ignore_index=True)
    df.to_csv(CSV_FILE, index=False)
    return jsonify({"message": "Success"}), 201

@app.route('/api/expenses/<int:index>', methods=['DELETE'])
def delete_expense(index):
    df = load_data()
    if 0 <= index < len(df):
        df = df.drop(df.index[index])
        df.to_csv(CSV_FILE, index=False)
        return jsonify({"message": "Deleted"})
    return jsonify({"error": "Failed"}), 404

@app.route('/api/report', methods=['GET'])
def generate_report():
    df = load_data()
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt="ExpenseX Financial Report", ln=True, align='C')
    pdf.set_font("Arial", size=10)
    pdf.cell(200, 10, txt=f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=True, align='C')
    pdf.ln(10)
    
    # Header
    pdf.set_fill_color(99, 102, 241) # Primary color
    pdf.set_text_color(255, 255, 255)
    pdf.cell(30, 10, "Date", 1, 0, 'C', True)
    pdf.cell(40, 10, "Category", 1, 0, 'C', True)
    pdf.cell(80, 10, "Description", 1, 0, 'C', True)
    pdf.cell(30, 10, "Amount", 1, 1, 'C', True)
    
    # Body
    pdf.set_text_color(0, 0, 0)
    for _, row in df.iterrows():
        pdf.cell(30, 10, str(row['Date']), 1)
        pdf.cell(40, 10, str(row['Category']), 1)
        pdf.cell(80, 10, str(row['Description']), 1)
        pdf.cell(30, 10, f"₹{row['Amount']}", 1, 1)
    
    report_path = 'outputs/report.pdf'
    os.makedirs('outputs', exist_ok=True)
    pdf.output(report_path)
    return send_file(report_path, as_attachment=True)

if __name__ == '__main__':
    # Use the port assigned by the cloud provider (Render/Heroku)
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
