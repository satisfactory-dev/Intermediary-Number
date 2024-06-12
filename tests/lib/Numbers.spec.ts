import {
	describe,
	it,
} from 'node:test';
import assert from 'node:assert/strict';
import {
	number_arg,
	Numbers,
} from '../../lib/Numbers';
import Fraction from 'fraction.js';
import {
	math_types,
} from '../../lib/IntermediaryNumber';
import {
	is_instanceof,
} from '@satisfactory-clips-archive/custom-assert/assert/CustomAssert';

void describe('Numbers', () => {
	void describe('divide_if_not_one', () => {
		const data_sets: (
			| [
				math_types,
				Fraction,
				string,
			]
		)[] = [
			[
				1,
				new Fraction(1),
				'1',
			],
			[
				1,
				new Fraction(2),
				'0.5',
			],
			[
				new Fraction(1),
				new Fraction(1),
				'1',
			],
			[
				new Fraction(1),
				new Fraction(2),
				'0.5',
			],
		];

		for (const [
			left,
			right,
			expectation,
		] of data_sets) {
			void it(
				`Numbers.divide_if_not_one(${
					JSON.stringify(left)
				}, ${
					right.toString()
				}) behaves as expected when returning ${
					expectation
				}`,
				() => {
					const require_fraction = Numbers.divide_if_not_one(
						left,
						right,
						true
					);
					const fraction_not_required = Numbers.divide_if_not_one(
						left,
						right,
						false
					);

					assert.strictEqual(
						require_fraction.toString(),
						expectation
					);

					is_instanceof(require_fraction, Fraction);

					assert.strictEqual(
						fraction_not_required.toString(),
						expectation
					);
				}
			)
		}
	})

	void describe('least_common_multiple_deferred', () => {
		const data_set:[
			[number_arg, number_arg, ...number_arg[]],
			string,
		][] = [
			[
				[1, 2],
				'2',
			],
			[
				[30, 50, 65], // iron ingot recipes as of April 2024
				'1950',
			],
			[
				[37.5, 22.5],
				'112.5',
			],
		];

		for (const entry of data_set) {
			const [numbers, expectation] = entry;
			void it(
				`Numbers.least_common_multiple_deferred(${
					JSON.stringify(numbers)
				}) returns ${expectation}`,
				() => {
					assert.equal(
						(new Fraction(expectation)).compare(
							Numbers.least_common_multiple_deferred(numbers)
						),
						0
					);
				}
			)
		}
	})
})
