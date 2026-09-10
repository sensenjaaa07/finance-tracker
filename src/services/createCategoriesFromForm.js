function createCategoriesFromForm(event) {
	const form = event.target
	const selectedEntryId = form.entryAction.value
	const name = form.category?.value.trim()
	const amount = Number(form.amount.value)

	if (!Number.isFinite(amount) || amount <= 0 || (selectedEntryId === 'new' && !name)) {
		return null
	}

	return {
		selectedEntryId,
		entry: selectedEntryId === 'new'
			? { id: crypto.randomUUID(), name, amount }
			: { id: selectedEntryId, amount },
	}
}

export default createCategoriesFromForm
