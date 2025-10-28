import { RMLEventName } from "../types";
import { IObservature, isObservature } from "./observature";
import { USE_DOM_OBSERVABLES } from "../constants";
import { MonkeyPatchedObservable } from "../types/monkey-patched-observable";
import { RMLEventListener } from "../types/event-listener";
import { toListener } from "../utils/to-listener";
import type { Observable } from "../types/futures";

const isEventListenerObject = (l: unknown): l is EventListenerObject => !!(l && (l as any).handleEvent);

type Whenable = {
	when: (eventName: RMLEventName, options?: unknown) => Observable<Event>;
};

const hasWhen = (n: EventTarget): n is EventTarget & Whenable => typeof (n as any)?.when === 'function';

export const addListener = (node: EventTarget, eventName: RMLEventName, listener: RMLEventListener, options?: AddEventListenerOptions | boolean) => {
	// We also force-add an event listener if we're inside a ShadowRoot (do we really need to?), as events inside web components don't seem to fire otherwise
	if (USE_DOM_OBSERVABLES && hasWhen(node)) {
		// Explicitly excluding the isEventListenerObject as Domenic doesn't want .when() to support it
		if (!isEventListenerObject(listener)) {
			const source = node.when(eventName, options as any);
			if (isObservature(listener)) {
				(listener as IObservature<Event>).addSource(source as unknown as MonkeyPatchedObservable<Event>);
			} else {
				// TODO: Add AbortController
				source.subscribe(listener as any);
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
