import type { MaybeFuture, Observer, ObserverFunction } from '../types/futures';
import type { Observable as RxObservable } from 'rxjs';
import type { RMLTemplateExpressions } from '../types/internal';

import { Subject } from 'rxjs';
import type { OperatorFunction } from 'rxjs';

/**
 * Create an "input pipe" by prepending operators to the input of an Observer, Subject, BehaviorSubject, or plain subscriber function.
 * This works the opposite of RxJS's pipe(), which works on the output of an Observable.
**/
export const pipeIn =
	<I, O = I>(target: RMLTemplateExpressions.TargetEventHandler<O>, ...pipeline: OperatorFunction<any, any>[]): Observer<I> => {
		const source = new Subject<I>();

		// Subscribe the processed stream to the provided target (function or Observer)
		// Apply operators one by one to avoid variadic tuple spreading issues
		let processed: Observable<any> = source as unknown as Observable<any>;
		for (const op of pipeline) {
			processed = op(processed as any);
		}

		if (typeof target === 'function') {
			// target is a function: subscribe with an ObserverFunction
			processed.subscribe(target as unknown as ObserverFunction<O>);
		} else {
			// target is an Observer
			processed.subscribe(target as unknown as Observer<O>);
		}

		// Return an Observer-like object that pushes values into the subject
		return source as unknown as Observer<I>;
	};

/**
 * Create an "input pipe" by prepending operators to an Observer or a Subject
 *
 * @remarks This works the opposite of the `pipe()` function in RxJS, which
 * transforms the output of an observable whilst this transforms the input.
 *
 * You normally use an input pipe to create Event Adapters.
 * 
 * @template I the input type of the returned stream (the event adapter)
 * @template O the output type of the returned stream (= the input type of the actual target stream)
 * @example const MyUsefulEventAdapter = inputPipe(...pipeline);
 * const template = rml`
 *   <input onkeypress="${MyUsefulEventAdapter(targetObserver)}">
 * `;
**/
// Loosen typing temporarily to unblock widespread call-sites across the codebase.
// TODO: restore strong generics once the Event/Observer type contracts are reconciled.
export const inputPipe = <I = any, O = any>(...pipeline: OperatorFunction<any, any>[]) =>
	(target: RMLTemplateExpressions.TargetEventHandler<O>) => pipeIn<I, O>(target, ...pipeline);


export const feed = pipeIn;
export const feedIn = pipeIn;

export const reversePipe = inputPipe;

// TBC
export const source = (...reversePipeline: Array<OperatorFunction<any, any> | Observer<any>>) => {
	const maybeObserver = reversePipeline.pop() as Observer<any> | undefined;
	const ops = reversePipeline as OperatorFunction<any, any>[];
	if (!maybeObserver) throw new Error('source(...) requires a final Observer argument');
	return pipeIn(maybeObserver, ...ops);
}

export const sink = (source: MaybeFuture<any>, ...pipeline: OperatorFunction<any, any>[]) =>
	// `source` may be a Promise or Observable — when Observable, call its pipe
	// We rely on the runtime shape; TypeScript typing here is intentionally permissive.
	(source as unknown as { pipe?: (...ops: OperatorFunction<any, any>[]) => any }).pipe?.(...pipeline as any);

