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

void describe('Numbers', () => {
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
