function debounce(fn, delay) {
	let timer = null;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), delay);
	};
}

export { debounce };
