from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import pandas as pd
import os
from fpdf import FPDF
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv
import json

# Load environment variables from .env file (if it exists)
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes (important for Vercel -> Render communication)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# --- Database Setup ---
MONGO_URI = os.environ.get('MONGO_URI')
client = None
db = None
expenses_col = None

if MONGO_URI:
    try:
        client = MongoClient(MONGO_URI)
        # Verify connection
        client.admin.command('ping')
        db = client.get_database('ExpenseX')
        expenses_col = db.expenses
        print("✅ Connected to MongoDB Atlas")
    except Exception as e:
        print(f"❌ MongoDB Connection Error: {e}")

# --- Fallback File Setup ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(BASE_DIR, 'data', 'expenses.csv')
os.makedirs(os.path.dirname(CSV_FILE), exist_ok=True)

@app.route('/', methods=['GET'])
def home():
    storage = "MongoDB Atlas" if expenses_col is not None else "Local CSV (Temporary)"
    return jsonify({
        "status": "online",
        "storage_mode": storage,
        "message": "ExpenseX API is running!",
        "endpoints": ["/api/expenses", "/api/report", "/api/export-csv"]
    })

def load_data_as_df():
    """Helper to get current data as a Pandas DataFrame regardless of source."""
    if expenses_col is not None:
        cursor = expenses_col.find({}, {'_id': 0}) # Exclude MongoDB ID for consistency
        data = list(cursor)
        return pd.DataFrame(data) if data else pd.DataFrame(columns=['Date', 'Category', 'Amount', 'Description', 'Type'])
    
    if os.path.exists(CSV_FILE):
        return pd.read_csv(CSV_FILE).fillna('')
    return pd.DataFrame(columns=['Date', 'Category', 'Amount', 'Description', 'Type'])

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    df = load_data_as_df()
    if df.empty:
        return jsonify([])
    df['Amount'] = pd.to_numeric(df['Amount'], errors='coerce').fillna(0)
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/expenses', methods=['POST'])
def add_expense():
    new_data = request.json
    # Basic validation
    if not new_data or 'Amount' not in new_data:
        return jsonify({"error": "Missing data"}), 400
    
    if expenses_col is not None:
        expenses_col.insert_one(new_data)
    else:
        df = load_data_as_df()
        new_row = pd.DataFrame([new_data])
        df = pd.concat([df, new_row], ignore_index=True)
        df.to_csv(CSV_FILE, index=False)
    
    return jsonify({"message": "Success"}), 201

@app.route('/api/expenses/<int:index>', methods=['DELETE'])
def delete_expense(index):
    df = load_data_as_df()
    if 0 <= index < len(df):
        if expenses_col is not None:
            # MongoDB doesn't have "row index", so we find the document by content
            # This is a simple workaround for the current frontend logic
            target = df.iloc[index].to_dict()
            expenses_col.delete_one(target)
        else:
            df = df.drop(df.index[index])
            df.to_csv(CSV_FILE, index=False)
        return jsonify({"message": "Deleted"})
    return jsonify({"error": "Failed"}), 404

@app.route('/api/report', methods=['GET'])
def generate_report():
    df = load_data_as_df()
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt="ExpenseX Financial Report", ln=True, align='C')
    pdf.set_font("Arial", size=10)
    pdf.cell(200, 10, txt=f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=True, align='C')
    pdf.ln(10)
    
    # Header
    pdf.set_fill_color(99, 102, 241) 
    pdf.set_text_color(255, 255, 255)
    pdf.cell(30, 10, "Date", 1, 0, 'C', True)
    pdf.cell(40, 10, "Category", 1, 0, 'C', True)
    pdf.cell(80, 10, "Description", 1, 0, 'C', True)
    pdf.cell(30, 10, "Amount", 1, 1, 'C', True)
    
    # Body
    pdf.set_text_color(0, 0, 0)
    for _, row in df.iterrows():
        pdf.cell(30, 10, str(row.get('Date', '')), 1)
        pdf.cell(40, 10, str(row.get('Category', '')), 1)
        pdf.cell(80, 10, str(row.get('Description', '')), 1)
        pdf.cell(30, 10, f"INR {row.get('Amount', 0)}", 1, 1)
    
    report_path = 'outputs/report.pdf'
    os.makedirs('outputs', exist_ok=True)
    pdf.output(report_path)
    return send_file(report_path, as_attachment=True)

@app.route('/api/export-csv', methods=['GET'])
def export_csv():
    """Allows the user to download their raw data as CSV anytime."""
    df = load_data_as_df()
    export_path = 'outputs/expenses_export.csv'
    os.makedirs('outputs', exist_ok=True)
    df.to_csv(export_path, index=False)
    return send_file(export_path, as_attachment=True)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
