import { RMLEventName } from "../types";
import { IObservature, isObservature } from "./observature";
import { USE_DOM_OBSERVABLES } from "../constants";
import { MonkeyPatchedObservable } from "../types/monkey-patched-observable";
import { RMLEventListener } from "../types/event-listener";
import { toListener } from "../utils/to-listener";
import type { Observable } from "../types/futures";

const isEventListenerObject = (l: unknown): l is EventListenerObject => {
	return !!(l && typeof (l as EventListenerObject).handleEvent === 'function');
};

type Whenable = {
	when: (eventName: RMLEventName, options?: unknown) => Observable<Event>;
};

const hasWhen = (n: EventTarget): n is EventTarget & Whenable => {
	// Narrow by checking the runtime shape instead of using a broad `any` cast
	const candidate = n as unknown as Partial<Whenable>;
	return !!candidate && typeof candidate.when === 'function';
};

export const addListener = (node: EventTarget, eventName: RMLEventName, listener: RMLEventListener, options?: AddEventListenerOptions | boolean) => {
	// We also force-add an event listener if we're inside a ShadowRoot (do we really need to?), as events inside web components don't seem to fire otherwise
	if (USE_DOM_OBSERVABLES && hasWhen(node)) {
		// Explicitly excluding the isEventListenerObject as Domenic doesn't want .when() to support it
		if (!isEventListenerObject(listener)) {
			const source = (node as unknown as Whenable).when(eventName, options);
			if (isObservature(listener)) {
				(listener as IObservature<Event>).addSource(source as unknown as MonkeyPatchedObservable<Event>);
			} else {
				// If the listener is a plain function subscribe directly. Otherwise, convert it to a listener.
				if (typeof listener === 'function') {
					source.subscribe(listener as (e: Event) => unknown);
				} else {
					// fall back to using `toListener` to coerce other listener shapes to a function
					const fn = toListener(listener);
					if (fn) source.subscribe(fn);
				}
			}
		}
	} else {
		node.addEventListener(eventName, toListener(listener), options as EventListenerOptions | undefined);
	}

	if (/^(?:rml:)?mount/.test(eventName)) {
		// Will this need to bubble up? (probably no)
		setTimeout(() => node.dispatchEvent(new Event(eventName)));
	}
};
