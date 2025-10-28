import type { MaybeFuture, Observer, OperatorPipeline } from '../types/futures';
import type { RMLTemplateExpressions } from '../types/internal';

import { Subject } from 'rxjs';

/**
 * Create an "input pipe" by prepending operators to the input of an Observer, Subject, BehaviorSubject, or plain subscriber function.
 * This works the opposite of RxJS's pipe(), which works on the output of an Observable.
**/
export const pipeIn =
	<I, O=I>(target: RMLTemplateExpressions.TargetEventHandler<O>, ...pipeline: OperatorPipeline<I, O>): Observer<I> => {
		const source = new Subject<I>();
		const __args = pipeline as any[];
		source
			// use apply to avoid tuple-spread typing issues
			.pipe.apply(source, __args as any)
			.subscribe(target as any)
		;

		// FIXME: will we need to unsubscribe? Then store a reference for unsubscription
		// TODO: can we/should we delay subscription until mounted? Could miss the first events otherwise
		// TODO: check if a Subject is needed, or if we can connect directly to the target (e.g. w/ Observature.addSource)

		return source;
	}
;

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
export const inputPipe = <I = any, O = any>(...pipeline: any[]) =>
		(target: RMLTemplateExpressions.TargetEventHandler<O>) => {
			const __args = pipeline as any[];
			// use apply to avoid tuple-spread typing issues
			return (pipeIn as any).apply(null, [target as any].concat(__args));
		}
;

export const feed = pipeIn;
export const feedIn = pipeIn;

export const reversePipe = inputPipe;

// TBC
export const source = (...reversePipeline: any[]) =>
	(pipeIn as any).apply(null, [<Observer<any>>reversePipeline.pop(), ...reversePipeline]);

export const sink = (source: MaybeFuture<any>, ...pipeline: OperatorPipeline<any, any>) =>
	source.pipe(...pipeline);

