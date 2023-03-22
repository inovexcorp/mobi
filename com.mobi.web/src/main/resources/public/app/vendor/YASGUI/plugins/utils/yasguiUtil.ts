/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
/**
 * Extracted from yasgui-util
 *
 */

/**
 * creates a new svg from svgStrig
 * Appends svg to a newly creted div.
 */
export function drawSvgStringAsElement(svgString: string) {
	if (svgString && svgString.trim().indexOf('<svg') == 0) {
		//no style passed via config. guess own styles
		const parser = new DOMParser();
		const dom = parser.parseFromString(svgString, 'text/xml');
		const svg = dom.documentElement;

		const svgContainer = document.createElement('div');
		svgContainer.className = 'svgImg';
		svgContainer.appendChild(svg);
		return svgContainer;
	}
	throw new Error('No svg string given. Cannot draw');
}
export interface FaIcon {
	width: number;
	height: number;
	svgPathData: string;
}

/**
 * Draws font fontawesome icon as svg. This is a lot more lightweight then the option that is offered by fontawesome
 * @param faIcon
 * @returns
 */
export function drawFontAwesomeIconAsSvg(faIcon: FaIcon) {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${faIcon.width} ${faIcon.height}"><path fill="currentColor" d="${faIcon.svgPathData}"></path></svg>`;
}

export function hasClass(el: Element | undefined, className: string) {
	if (!el) {
		return;
	}
	if (el.classList) {
		return el.classList.contains(className);
	} else {
		return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
	}
}

export function addClass(el: Element |  undefined | null, ...classNames: string[]) {
	if (!el) {
		return;
	}
	for (const className of classNames) {
		if (el.classList) {
			el.classList.add(className);
		} else if (!hasClass(el, className)) {
			el.className += ' ' + className;
		}
	}
}

export function removeClass(el: Element | undefined | null, className: string) {
	if (!el) {
		return;
	}
	if (el.classList) {
		el.classList.remove(className);
	} else if (hasClass(el, className)) {
		const reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
		el.className = el.className.replace(reg, ' ');
	}
}

export function getAsValue<E, A>(valueOrFn: E | ((arg:A) => E), arg:A): E {
	if (typeof valueOrFn === 'function') {
		return (valueOrFn as any)(arg);
	}
	return valueOrFn;
}
