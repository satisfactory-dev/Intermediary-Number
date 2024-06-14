import {
	describe,
	it,
} from 'node:test';
import assert from 'node:assert/strict';

import {
	IntermediaryCalculation,
	IntermediaryNumber,
} from '../../index';

void describe('IntermediaryCalculation', () => {
	void describe('toStringCalculation', () => {
		void it('behaves', () => {
			assert.strictEqual(
				(new IntermediaryCalculation(
					IntermediaryNumber.One,
					'+',
					IntermediaryNumber.One,
				)).toStringCalculation(),
				'1 + 1'
			)
		})
	})

	void describe('fromString, toString, toStringCalculation', () => {
		const data_sets:[string, string, string][] = [
			['1+1', '1 + 1', '2'],
			['1+2/3', '(1 + 2) / 3', '1'],
			['1+(2/3)', '1 + (2 / 3)', '1.(6)'],
		];

		for (const [
			input,
			expectation_calculation,
			expectation_resolve,
		] of data_sets) {
			void it(
				`foo = IntermediaryCalculation.fromString(${
					input
				}); foo.toStringCalculation() === ${
					expectation_calculation
				}; foo.toString() === ${
					expectation_resolve
				}; foo.toString() === foo.resolve().toString()`,
				() => {
					const from_string = IntermediaryCalculation.fromString(
						input
					);
					IntermediaryCalculation.require_is(from_string);

					assert.strictEqual(
						from_string.toStringCalculation(),
						expectation_calculation
					)

					assert.strictEqual(
						from_string.toString(),
						expectation_resolve
					)

					assert.strictEqual(
						from_string.toString(),
						from_string.resolve().toString()
					)
				}
			)
		}
	})

	void describe('require_is', () => {
		void it('behaves', () => {
			const from_string = IntermediaryCalculation.fromString(
				'1+1'
			);
			IntermediaryCalculation.require_is(from_string);

			assert.doesNotThrow(
				() => IntermediaryCalculation.require_is(from_string)
			);

			assert.throws(() => IntermediaryCalculation.require_is(undefined));
		})
	})
})
