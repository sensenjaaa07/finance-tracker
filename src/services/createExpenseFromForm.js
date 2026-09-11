function createExpenseFromForm(event) {
  event.preventDefault()
  const id = crypto.randomUUID()
  const form = event.target
  const title = form.title.value.trim()
  const amount = parseFloat(form.amount.value)
  const date = new Date(form.date.value)
  const category = form.category.value
  const accountId = form.accountId?.value || ''

  if (!title || !category || !accountId || isNaN(amount) || amount <= 0 || Number.isNaN(date.getTime())) return null

  const expenseEntry = { id, title, amount, date, category, accountId }
  form.reset()
  return expenseEntry
}

export default createExpenseFromForm
