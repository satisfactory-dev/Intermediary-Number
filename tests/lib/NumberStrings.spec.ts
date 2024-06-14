import {
	describe,
	it,
} from 'node:test';
import assert from 'node:assert/strict';
import {
	NumberStrings,
} from '../../lib/NumberStrings';
import BigNumber from 'bignumber.js';

import {
	IntermediaryCalculation,
	IntermediaryNumber,
	number_arg,
	operand_types,
} from '../../index';

void describe('NumberStrings', () => {
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

	void describe('round_off', () => {
		const data_sets:[number_arg|operand_types, string][] = [
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
			[IntermediaryNumber.create('22.00000001'), '22'],
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
						NumberStrings.round_off(
							(
								(input instanceof IntermediaryNumber)
								|| (input instanceof IntermediaryCalculation)
							)
								? input
								: BigNumber(input)
						),
						expectation
					)
				}
			)
		}
	})
})
