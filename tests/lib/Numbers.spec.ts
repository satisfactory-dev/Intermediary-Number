import {
	describe,
	it,
} from 'node:test';
import assert from 'node:assert/strict';
import Fraction from 'fraction.js';
import {
	is_instanceof,
} from '@satisfactory-dev/custom-assert';

import {
	math_types,
	number_arg,
	Numbers,
} from '../../index';

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
						true,
					);
					const fraction_not_required = Numbers.divide_if_not_one(
						left,
						right,
						false,
					);

					assert.strictEqual(
						require_fraction.toString(),
						expectation,
					);

					is_instanceof(require_fraction, Fraction);

					assert.strictEqual(
						fraction_not_required.toString(),
						expectation,
					);
				},
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
							Numbers.least_common_multiple_deferred(numbers),
						),
						0,
					);
				},
			)
		}
	})

	void describe('sum_series_fraction', () => {
		void it('throws if a is less than or equal to b', () => {
			assert.throws(() => Numbers.sum_series_fraction(
				new Fraction(1),
				new Fraction(1),
			));
			assert.throws(() => Numbers.sum_series_fraction(
				new Fraction(0.5),
				new Fraction(1),
			));
		})

		const data_sets:[Fraction, Fraction, Fraction][] = [
			[
				new Fraction(1),
				new Fraction(0.25),
				new Fraction(4/3),
			],
		];

		for (const [
			a,
			b,
			expectation,
		] of data_sets) {
			void it(
				`Numbers.sum_series_fraction(${
					a.toString()
				}, ${
					b.toString()
				}) === ${
					expectation.toString()
				}`,
				() => {
					assert.strictEqual(
						Numbers.sum_series_fraction(a, b).compare(
							expectation,
						),
						0,
					);
				},
			)
		}
	})
})
