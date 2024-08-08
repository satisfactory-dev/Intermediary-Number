import {
	integer_string__type,
	is_string,
	NotAnAmountString,
	StringPassedRegExp,
} from './Docs.json';
import BigNumber from 'bignumber.js';
import Fraction from 'fraction.js';
import type {
	operand_types,
} from './IntermediaryNumber';

export type amount_string =
	| StringPassedRegExp<'^\\d+(?:\\.\\d{1,6})?$'>
	| integer_string__type
	| '1'
	| '0';

export type numeric_string =
	| amount_string
	| StringPassedRegExp<'^-?(?:\\d*\\.\\d+|\\d+(?:\\.\\d+)?)$'>

export class NumberStrings
{
	static amount_string(maybe:string): amount_string
	{
		this.throw_if_not_amount_string(maybe);

		return maybe;
	}

	static is_amount_string(maybe:unknown): maybe is amount_string {
		return (
			is_string(maybe)
			&& (
				maybe === '0'
				|| /^\d+(?:\.\d{1,6})?$/.test(maybe)
				|| /^\d*(?:\.\d{1,6})$/.test(maybe)
				|| /^\d+$/.test(maybe)
			)
		);
	}

	static is_numeric_string(
		maybe:unknown,
	) : maybe is numeric_string {
		return (
			this.is_amount_string(maybe)
			|| (
				is_string(maybe)
				&& /^-?(?:\d*\.\d+|\d+(?:\.\d+)?)$/.test(maybe)
			)
		);
	}

	static round_off(
		number:
			| BigNumber
			| Fraction
			| operand_types,
	): amount_string {
		let result:string;

		number = (
			(number instanceof BigNumber)
			|| (number instanceof Fraction)
		)
			? number
			: number.toBigNumberOrFraction();

		if (number instanceof BigNumber) {
			this.configure();
			result = number.toString();
		} else {
			result = number.valueOf().toString();
		}

		if (/\.\d{7,}$/.test(result)) {
			const [before, after] = result.split('.');

			return `${
				before
			}.${
				'0' === after.substring(6, 7)
					? after.substring(0, 6).replace(/0+$/, '')
					: (
						parseInt(after.substring(0, 6), 10) + 1
					).toString().padStart(
						Math.min(6, after.length),
						'0',
					)
			}`.replace(/\.$/, '') as amount_string;
		}

		return result as amount_string;
	}

	private static configure()
	{
		BigNumber.set({
			DECIMAL_PLACES: 7,
			ROUNDING_MODE: BigNumber.ROUND_HALF_CEIL,
		});
	}

	private static throw_if_not_amount_string(
		maybe:string,
	): asserts maybe is amount_string {
		if (
			!this.is_amount_string(maybe)
		) {
			throw new NotAnAmountString(
				'Not a supported amount string!',
			);
		}
	}
}
