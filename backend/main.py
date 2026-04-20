import pandas as pd
import os

def analyze_expenses():
    # Load data
    data_path = 'data/expenses.csv'
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found.")
        return

    df = pd.read_csv(data_path)
    df['Date'] = pd.to_datetime(df['Date'])
    
    print("\n--- Expense Tracker Insights ---")
    
    # 1. Total Income vs Total Expense
    summary = df.groupby('Type')['Amount'].sum()
    income = summary.get('Income', 0)
    expense = summary.get('Expense', 0)
    balance = income - expense
    
    print(f"Total Income:  ₹{income:,.2f}")
    print(f"Total Expense: ₹{expense:,.2f}")
    print(f"Current Balance: ₹{balance:,.2f}")
    
    # 2. Category-wise Spending
    expenses_df = df[df['Type'] == 'Expense']
    category_spend = expenses_df.groupby('Category')['Amount'].sum().sort_values(ascending=False)
    
    print("\n--- Spending by Category ---")
    print(category_spend.to_string())
    
    # 3. Monthly Trends
    df['Month'] = df['Date'].dt.to_period('M')
    monthly_trends = df[df['Type'] == 'Expense'].groupby('Month')['Amount'].sum()
    
    print("\n--- Monthly Expense Trends ---")
    print(monthly_trends.to_string())
    
    # 4. Insights
    highest_cat = category_spend.idxmax()
    highest_amt = category_spend.max()
    print(f"\n💡 Insight: You spent the most on '{highest_cat}' (₹{highest_amt:,.2f}).")
    
    if balance < 0:
        print("⚠️ Warning: You are spending more than your income!")
    else:
        print("✅ Great job! You are living within your means.")

    # Save outputs
    os.makedirs('outputs', exist_ok=True)
    category_spend.to_csv('outputs/category_spending.csv')
    print("\nDetailed insights saved to 'backend/outputs/'.")

if __name__ == "__main__":
    analyze_expenses()
