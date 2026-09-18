// DOM Helpers
// Utility functions for DOM manipulation

export function createElement(tag, attributes = {}, children = []) {
	const element = document.createElement(tag);
	Object.entries(attributes).forEach(([key, value]) => {
		if (key === "style" && typeof value === "object") {
			Object.assign(element.style, value);
		} else if (key.startsWith("on") && typeof value === "function") {
			element.addEventListener(key.slice(2).toLowerCase(), value);
		} else {
			element.setAttribute(key, value);
		}
	});
	children.forEach((child) => {
		if (typeof child === "string") {
			element.appendChild(document.createTextNode(child));
		} else if (child instanceof Node) {
			element.appendChild(child);
		}
	});
	return element;
}

export function setInnerHTML(element, html) {
	element.innerHTML = html;
}

export function query(selector, parent = document) {
	return parent.querySelector(selector);
}

export function queryAll(selector, parent = document) {
	return Array.from(parent.querySelectorAll(selector));
}

export function on(element, event, handler, options) {
	element.addEventListener(event, handler, options);
	return () => element.removeEventListener(event, handler, options);
}

export function off(element, event, handler, options) {
	element.removeEventListener(event, handler, options);
}

export function delegate(parent, selector, event, handler) {
	parent.addEventListener(event, (e) => {
		const target = e.target.closest(selector);
		if (target) handler.call(target, e);
	});
	return () => parent.removeEventListener(event, handler);
}
