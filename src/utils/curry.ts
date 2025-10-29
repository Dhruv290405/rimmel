import type { RMLTemplateExpressions } from '../types/internal';
import type { OperatorFunction } from 'rxjs';

import { inputPipe, pipeIn } from '../utils/input-pipe';
import { pipe } from 'rxjs';
import type { Observable } from 'rxjs';

/**
 * Currying "out" for observable streams
 * Create a curried observable stream from a given source
 * by applying the specified pipeline to it
 */
export const curryOut = (...args: Array<OperatorFunction<any, any> | unknown>) => {
	const maybeLast = args.at(-1);
	const source = maybeLast && (maybeLast as any)?.subscribe ? (args.pop() as any) : undefined;

	const ops = args as OperatorFunction<any, any>[];

	const stream = (s: any) => ops.reduce((acc, fn) => fn(acc), s);

	return source ? stream(source as any) : stream;
};


/**
 * Currying "in" for input stream operators
 * Create a curried observer stream from a given target
 * by applying the specified input pipeline to it
 **/
export const curry =
	<I, O>
	(op: OperatorFunction<I, O>, destination?: RMLTemplateExpressions.Any) =>
		destination
			? pipeIn(destination as any, op)
			: inputPipe(op as OperatorFunction<any, any>)
;
