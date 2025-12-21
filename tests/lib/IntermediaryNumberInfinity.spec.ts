import {
	describe,
	it,
} from 'node:test';
import assert from 'node:assert/strict';

import type {
	math_types,
} from '../../lib/IntermediaryNumber.ts';
import {
	IntermediaryNumber,
	IntermediaryNumberInfinity,
} from '../../lib/IntermediaryNumber.ts';

void describe('IntermediaryNumberInfinity', () => {
	void describe('compare', () => {
		const data_sets: [
			math_types,
			IntermediaryNumber|IntermediaryNumberInfinity,
			0|1|-1,
		][] = [
			[IntermediaryNumber.Zero, IntermediaryNumberInfinity.Zero, 1],
			[IntermediaryNumberInfinity.Zero, IntermediaryNumber.Zero, -1],
			[
				IntermediaryNumberInfinity.Zero,
				IntermediaryNumberInfinity.One,
				0,
			],
		];

		for (const [
			a,
			b,
			expectation,
		] of data_sets) {
			const remapped = IntermediaryNumber.reuse_or_create(a);
			void it(
				`${
					remapped.toString()
				} <=> ${
					b.toString()
				} === ${
					expectation
				}`,
				() => {
					assert.strictEqual(
						remapped.compare(b),
						expectation,
					);
				},
			);
		}
	});
});
