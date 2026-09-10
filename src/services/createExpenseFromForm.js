function createExpenseFromForm(event) {
    event.preventDefault();
    const id = crypto.randomUUID();
    const form = event.target;
    const title = form.title.value;
    const amount = parseFloat(form.amount.value);
    const date = new Date(form.date.value);
    const category = form.category.value;

    if (!title || !category || isNaN(amount) || Number.isNaN(date.getTime())) {
        return null;
    }

    const expenseEntry = { id, title, amount, date, category };
    console.log('Expense added:', expenseEntry);
    form.reset();
    return expenseEntry;
}

export default createExpenseFromForm;