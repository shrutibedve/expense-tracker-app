import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Page Config
st.set_page_config(page_title="Expense Tracker Dashboard", layout="wide")

st.title("📊 Expense Tracker Dashboard")
if st.button("🔄 Refresh Data"):
    st.rerun()
st.markdown("Analyze your spending behavior with ease.")

# Load Data
def load_data():
    data_path = 'data/expenses.csv'
    if os.path.exists(data_path):
        df = pd.read_csv(data_path)
        df['Date'] = pd.to_datetime(df['Date'])
        return df
    return None

df = load_data()

if df is not None:
    # Sidebar Filters
    st.sidebar.header("Filters")
    categories = st.sidebar.multiselect("Select Category", options=df['Category'].unique(), default=df['Category'].unique())
    filtered_df = df[df['Category'].isin(categories)]

    # KPI Cards
    col1, col2, col3 = st.columns(3)
    income = filtered_df[filtered_df['Type'] == 'Income']['Amount'].sum()
    expenses = filtered_df[filtered_df['Type'] == 'Expense']['Amount'].sum()
    
    col1.metric("Total Income", f"₹{income:,.2f}")
    col2.metric("Total Expenses", f"₹{expenses:,.2f}", delta_color="inverse")
    col3.metric("Net Balance", f"₹{income - expenses:,.2f}")

    st.divider()

    # Visualizations
    col_left, col_right = st.columns(2)

    with col_left:
        st.subheader("Spending by Category")
        expense_df = filtered_df[filtered_df['Type'] == 'Expense']
        if not expense_df.empty:
            cat_data = expense_df.groupby('Category')['Amount'].sum()
            fig, ax = plt.subplots()
            cat_data.plot(kind='pie', autopct='%1.1f%%', ax=ax, colors=sns.color_palette('pastel'))
            ax.set_ylabel('')
            st.pyplot(fig)
        else:
            st.write("No expense data found for selected filters.")

    with col_right:
        st.subheader("Monthly Trends")
        filtered_df['Month'] = filtered_df['Date'].dt.strftime('%b %Y')
        trend_data = filtered_df[filtered_df['Type'] == 'Expense'].groupby('Month')['Amount'].sum()
        if not trend_data.empty:
            st.bar_chart(trend_data)
        else:
            st.write("No trend data available.")

    # Data Table
    st.subheader("Raw Data")
    st.dataframe(filtered_df.sort_values(by='Date', ascending=False), use_container_width=True)

else:
    st.error("Dataset not found! Please check 'backend/data/expenses.csv'.")
