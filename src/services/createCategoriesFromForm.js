function createCategoriesFromForm(event) {
	const form = event.target
	const selectedEntryId = form.entryAction.value
	const name = form.category?.value.trim()
	const rawAmount = form.amount?.value
	const amount = rawAmount === undefined || rawAmount === '' ? 0 : Number(rawAmount)

	if ((selectedEntryId === 'new' && !name) || (rawAmount !== undefined && rawAmount !== '' && (!Number.isFinite(amount) || amount <= 0))) {
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
