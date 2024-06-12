import {
	describe,
	it,
} from 'node:test';
import assert from 'node:assert/strict';
import {
	number_arg,
	Numbers,
} from '../../lib/Numbers';
import {
	NumberStrings,
} from '../../lib/NumberStrings';
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
					const get_result = () => NumberStrings.amount_string(
						input
					);

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
				`NumberStrings.round_off(${
					input.toString()
				}) returns ${
					expectation
				}`,
				() => {
					assert.equal(
						NumberStrings.round_off(BigNumber(input)),
						expectation
					)
				}
			)
		}
	})
})
