function createIncomeFromForm(event) {
  event.preventDefault()

  const form = event.target
  const title = form.title.value.trim()
  const amount = Number(form.amount.value)
  const date = new Date(form.date.value)

  if (!title || !Number.isFinite(amount) || amount <= 0 || Number.isNaN(date.getTime())) {
    return null
  }

  return {
    id: crypto.randomUUID(),
    title,
    amount,
    date,
  }
}

export default createIncomeFromForm
