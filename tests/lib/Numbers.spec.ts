import {
	describe,
	it,
} from 'node:test';
import assert from 'node:assert/strict';
import {
	amount_string,
	number_arg,
	Numbers,
} from '../../lib/Numbers';
import {
	require_non_empty_array,
} from '@satisfactory-clips-archive/docs.json.ts/lib/ArrayUtilities';
import {
	integer_string__type,
} from '../../generated-types/update8/common/unassigned';
import BigNumber from 'bignumber.js';
import Fraction from 'fraction.js';

void describe('Math', () => {
	void describe('amount_string', () => {
		const expectations: [
			string,
			(true|{[key: string]: unknown}),
		][] = [
			['0', true],
			['1', true],
			['1.1', true],
			['-1', {
				property: '-1',
				message: 'Not a supported amount string!',
			}],
		];

		for (const entry of expectations) {
			const [input, expectation] = entry;

			void it(
				`${
					true === expectation
						? 'behaves'
						: 'throws'
				} with ${
					JSON.stringify(input)
				}`,
				() => {
					const get_result = () => Numbers.amount_string(input);

					if (true === expectation) {
						assert.doesNotThrow(get_result);
						assert.equal(get_result(), input);
					} else {
						assert.throws(get_result, expectation);
					}
				}
			)
		}
	})

	void describe('fraction_to_BigNumber', () => {
		const data_sets:[number, number, string, string][] = [
			[1, 3, '0.(3)', '0.3333333333333333'],
		];

		for (const data_set of data_sets) {
			const [
				a,
				b,
				expected_fraction_string,
				expected_bignumber_string,
			] = data_set;

			void it(
				`Numbers.fraction_to_BigNumber(${
					a
				}/${
					b
				}).toString() returns ${
					expected_bignumber_string
				}`,
				() => {
					const fraction = (new Fraction(a)).div(b);

					assert.equal(
						fraction.toString(),
						expected_fraction_string,
					);
					assert.equal(
						Numbers.fraction_to_BigNumber(
							fraction
						).toString(),
						expected_bignumber_string
					);
				}
			)
		}
	})

	void describe('greatest_common_denominator', () => {
		const data_set:[number_arg, number_arg, amount_string][] = [
			[1, 2, '1' as integer_string__type],
			[2, 3, '1' as integer_string__type],
			[7, 14, '7' as integer_string__type],
		];

		for (const entry of data_set) {
			const [a, b, expectation] = entry;

			void it(
				`Numbers.greatest_common_denominator(${
					a.toString()
				}, ${
					b.toString()
				}) returns ${
					expectation
				}`,
				() => {
					assert.equal(
						Numbers.greatest_common_denominator(a, b).toString(),
						expectation
					);
				}
			)
		}
	})

	void describe('least_common_multiple', () => {
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
				`Numbers.least_common_multiple(${
					JSON.stringify(numbers)
				}) returns ${expectation}`,
				() => {
					assert.equal(
						BigNumber(expectation).comparedTo(
							Numbers.least_common_multiple(numbers)
						),
						0
					);
				}
			)
		}
	})

	void describe('round_off', () => {
		const data_sets:[number_arg, string][] = [
			[22.50000001, '22.5'],
			[20/65, '0.307693'],
			[BigNumber('22.00000001'), '22'],
			[BigNumber('22.0000001'), '22.000001'],
			[BigNumber('22.000001'), '22.000001'],
			[BigNumber('22.00001'), '22.00001'],
			[BigNumber('22.0001'), '22.0001'],
			[BigNumber('22.001'), '22.001'],
			[BigNumber('22.01'), '22.01'],
			[BigNumber('22.1'), '22.1'],
			[BigNumber('22'), '22'],
		];

		for (const entry of data_sets) {
			const [input, expectation] = entry;

			void it(
				`Numbers.round_off(${
					input.toString()
				}) returns ${
					expectation
				}`,
				() => {
					assert.equal(
						Numbers.round_off(BigNumber(input)),
						expectation
					)
				}
			)
		}
	})
})
