import {
	describe,
	it,
} from 'node:test';
import assert from 'node:assert/strict';
import {
	CanConvertType,
	CanConvertTypeJson,
	IntermediaryCalculation,
	IntermediaryNumber,
	math_types,
	NotValid,
	operand_types,
} from '../../lib/IntermediaryNumber';
import Fraction from 'fraction.js';
import BigNumber from 'bignumber.js';
import {
	NumberStrings,
} from '../../lib/NumberStrings';
import {
	not_undefined,
} from '@satisfactory-clips-archive/custom-assert/assert/CustomAssert';
import {
	input_types,
	type_property_types,
} from '../../lib/IntermediaryNumberTypes';

void describe('IntermediaryNumber', () => {
	const create_data_sets:[
			input_types,
			type_property_types|undefined,
		][] = [
			[
				'',
				'amount_string',
			],
			[
				'1',
				'amount_string',
			],
			[
				'lolnope',
				undefined,
			],
			[
				new Fraction(1/3),
				'Fraction',
			],
			[
				new BigNumber('999999999999999999999999999999999'),
				'BigNumber',
			],
			[
				'0.13r',
				'Fraction',
			],
			[
				'0.1(3)',
				'Fraction',
			],
			[
				'0.1(23)',
				'Fraction',
			],
			[
				'0.1[3]',
				'Fraction',
			],
			[
				'0.1[23]',
				'Fraction',
			],
			[
				'0.1(3)r',
				'Fraction',
			],
			[
				'0.1(23)r',
				'Fraction',
			],
			[
				'0.1[3]r',
				'Fraction',
			],
			[
				'0.1[23]r',
				'Fraction',
			],
		];
	void describe('create', () => {
		for (const data_set of create_data_sets) {
			const [input, expectation] = data_set;

			void it(
				`IntermediaryNumber.create(${
					input.toString()
				})${
					undefined === expectation
						? ' throws'
						: `.type === ${expectation}`
				}`,
				() => {
					const get_value = () => IntermediaryNumber.create(input);

					if ('' === input) {
						assert.strictEqual(
							get_value(),
							IntermediaryNumber.Zero
						)
						assert.strictEqual(
							get_value().type,
							expectation
						)
						return;
					}

					if (undefined === expectation) {
						assert.throws(get_value);
					} else {
						const value = get_value();
						assert.strictEqual(
							value.type,
							expectation,
							`type of ${
								JSON.stringify(value.toJSON())
							} was expected to be ${
								expectation
							}, receieved ${
								value.type
							}`
						);
					}
				}
			)
		}
	})

	void describe('create_if_valid', () => {
		const data_sets:[
			input_types,
			'IntermediaryCalculation'|type_property_types|undefined,
		][] = [
			...create_data_sets.map(
				(e): [
					input_types,
					type_property_types|undefined,
				] => [
					e[0],
					'' === e[0] ? undefined : e[1],
				]
			),
			[
				'4 / 3',
				'IntermediaryCalculation',
			],
		];

		for (const [
			input,
			expectation,
		] of data_sets) {
			void it(
				`IntermediaryNumber.create_if_valid(${
					input.toString()
				})${
					undefined === expectation
						? ' throws'
						: `.type === ${expectation}`
				}`,
				() => {
					const maybe = IntermediaryNumber.create_if_valid(
						input.toString()
					);

					let failure:string|undefined = undefined;

					if (!(maybe instanceof NotValid)) {
						failure = `Expecting an instance of NotValid, receieved ${
							JSON.stringify(maybe.toJSON())
						}`;
					}

					assert.strictEqual(
						maybe instanceof NotValid,
						(undefined === expectation),
						failure
					);

					if (undefined !== expectation) {
						const typecast = maybe as Exclude<
							typeof maybe,
							NotValid
						>;

						assert.strictEqual(
							typecast.type,
							expectation,
							`type of ${
								JSON.stringify(typecast.toJSON())
							} from input "${
								input.toString()
							}" was expected to be ${
								expectation
							}, receieved ${
								typecast.type
							}`
						);
					}
				}
			)
		}
	})

	void describe('do_math_then_dispose', () => {
		void it('behaves', () => {
			assert.strictEqual(
				IntermediaryNumber.One.do_math_then_dispose(
					'divide',
					1
				),
				IntermediaryNumber.One
			);
			assert.strictEqual(
				IntermediaryNumber.Zero.do_math_then_dispose(
					'times',
					1
				),
				IntermediaryNumber.Zero
			);
			assert.strictEqual(
				IntermediaryNumber.One.do_math_then_dispose(
					'plus',
					1
				).compare(2),
				0
			);
		})
	})

	void describe('isGreaterThan', () => {
		const data_sets:[operand_types|input_types, math_types, boolean][] = [
			[IntermediaryNumber.One, IntermediaryNumber.Zero, true],
			[IntermediaryNumber.One, IntermediaryNumber.One, false],
			[IntermediaryNumber.Zero, IntermediaryNumber.One, false],
		];

		for (const [
			left_raw,
			right_raw,
			expectation,
		] of data_sets) {
			const left = IntermediaryNumber.reuse_or_create(left_raw);
			const right = IntermediaryNumber.reuse_or_create(right_raw);

			void it(
				`IntermediaryNumber.isGreaterThan(${
					left.toString()
				}, ${
					right.toString()
				}) === ${
					expectation ? 'true' : 'false'
				}`,
				() => {
					assert.strictEqual(
						left.isGreaterThan(right),
						expectation
					)
				}
			)
		}
	})

	void describe('toAmountString', () => {
		void it('behaves', () => {
			assert.strictEqual(
				IntermediaryNumber.create('0.333333').toAmountString(),
				'0.333333'
			)
			assert.strictEqual(
				IntermediaryNumber.create(new Fraction(1/3)).toAmountString(),
				'0.333334'
			)
		})
	})
});

void describe('IntermediaryCalculation', () => {
	void it ('does a better job of handling things than native', () => {
		assert.notStrictEqual(
			(0.8 - 0.1).toFixed(16),
			'0.7'
		);
		assert.strictEqual(
			IntermediaryNumber.create(0.8).minus(0.1).toString(),
			'0.7'
		);
		assert.notStrictEqual(
			BigNumber(
				NumberStrings.amount_string('0.333333')
			).times(3).toString(),
			'1'
		),
		assert.strictEqual(
			IntermediaryNumber.create('0.3r').times(3).toString(),
			'1'
		);
	});
})

void describe('do_math', () => {
	const data_sets:[
		string,
		'divide'|'minus'|'modulo'|'plus'|'times',
		string,
		string,
	][] = [
		[
			'1',
			'divide',
			'3',
			'0.(3)',
		],
		[
			'1/3',
			'divide',
			'2',
			'0.1(6)',
		],
		[
			'1',
			'divide',
			'2/3',
			'1.5',
		],
		[
			'1/2',
			'divide',
			'3/4',
			'0.(6)',
		],
		[
			'1-2',
			'minus',
			'3',
			'-4',
		],
		[
			'1',
			'minus',
			'2/3',
			'0.(3)',
		],
		[
			'1',
			'modulo',
			'2',
			'1',
		],
		[
			'1/2',
			'modulo',
			'3',
			'0.5',
		],
		[
			'1',
			'plus',
			'2',
			'3',
		],
		[
			'1 + 2',
			'plus',
			'2',
			'5',
		],
		[
			'1',
			'plus',
			'2/3',
			'1.(6)',
		],
		[
			'1',
			'times',
			'2',
			'2',
		],
		[
			'1/2',
			'times',
			'3',
			'1.5',
		],
	];

	for (const data_set of data_sets) {
		const [
			left_operand_input,
			operator_method,
			right_operand_input,
			expectation,
		] = data_set;

		const left_operand = IntermediaryCalculation.fromString(
			left_operand_input
		);

		const right_operand = IntermediaryCalculation.fromString(
			right_operand_input
		);

		void it(
			`IntermediaryCalculation: (${
				left_operand_input
			}) ${
				operator_method
			} (${
				right_operand_input
			}) returns ${
				expectation
			}`,
			() => {
				assert.strictEqual(
					left_operand[operator_method](right_operand).toString(),
					expectation,
				);
			}
		)
	}
});

void describe('abs', () => {
	const data_sets:[() => operand_types, string][] = [
		[
			() => IntermediaryNumber.create('-1'),
			'1',
		],
		[
			() => IntermediaryNumber.One,
			'1',
		],
		[
			() => IntermediaryNumber.Zero,
			'0',
		],
		[
			() => IntermediaryCalculation.fromString('1 - 2'),
			'1',
		],
		[
			() => IntermediaryCalculation.fromString('1 + 2'),
			'3',
		],
		[
			() => IntermediaryCalculation.fromString('1 - 1'),
			'0',
		],
	];

	for (let index = 0; index < data_sets.length; ++index) {
		void it (`behaves with data set ${index}`, () => {
			const [
				get_value,
				expectation,
			] = data_sets[index];

			let value:
				| operand_types
				| undefined = undefined;

			assert.doesNotThrow(() => {
				value = get_value();
			});

			assert.strictEqual(
				(
					value as unknown as operand_types
				).abs().toString(),
				expectation
			);
		})
	}

	void it('returns IntermediaryNumber.Zero', () => {
		assert.strictEqual(
			IntermediaryNumber.Zero.abs(),
			IntermediaryNumber.Zero
		)
	})
})

void describe('max', () => {
	const data_sets:[
		[
			math_types,
			math_types,
			...math_types[],
		],
		string,
	][] = [
		[
			[
				1,
				BigNumber(2),
				new Fraction(3/4),
				IntermediaryNumber.create('5.6r'),
				IntermediaryCalculation.fromString('7 - 8 * 9'),
			],
			'5.(6)',
		],
	];

	for (const data_set of data_sets) {
		const [[...max_args], expectation] = data_set;

		void it(
			`IntermediaryNumber max with ${
				max_args.map(e => e.toString()).join(', ')
			} returns ${
				expectation
			}`,
			() => {
				const index = Math.min(
					max_args.length - 1,
					Math.floor(Math.random() * max_args.length)
				);

				const initial_arg = IntermediaryNumber.reuse_or_create(
					max_args[index]
				);

				assert.strictEqual(
					initial_arg.max(...max_args).toString(),
					expectation
				);
			}
		)

		void it(
			`IntermediaryCalculation max with ${
				max_args.map(e => e.toString()).join(', ')
			} returns ${
				expectation
			}`,
			() => {
				const index = Math.min(
					max_args.length - 1,
					Math.floor(Math.random() * max_args.length)
				);

				const initial_arg = IntermediaryCalculation.fromString(
					IntermediaryNumber.reuse_or_create(
						max_args[index]
					).toString()
				);

				assert.strictEqual(
					initial_arg.max(...max_args).toString(),
					expectation
				);
			}
		)
	}
})

void describe('CanConvertType', () => {
	const data_sets:(
		| [() => CanConvertType, CanConvertTypeJson]
		| [
			() => IntermediaryCalculation,
			CanConvertTypeJson,
			CanConvertTypeJson,
		]
	)[] = [
		[
			() => IntermediaryNumber.One,
			{
				type: 'IntermediaryNumber',
				value: '1',
			},
		],
		[
			() => IntermediaryNumber.create(new Fraction(1)),
			{
				type: 'IntermediaryNumber',
				value: '1',
			},
		],
		[
			() => IntermediaryNumber.create(new Fraction(2)),
			{
				type: 'IntermediaryNumber',
				value: '2',
			},
		],
		[
			() => IntermediaryNumber.create('0'),
			{
				type: 'IntermediaryNumber',
				value: '0',
			},
		],
		[
			() => IntermediaryNumber.create('1'),
			{
				type: 'IntermediaryNumber',
				value: '1',
			},
		],
		[
			() => IntermediaryNumber.create('2'),
			{
				type: 'IntermediaryNumber',
				value: '2',
			},
		],
		[
			() => IntermediaryNumber.create(new Fraction(2/3)),
			{
				type: 'IntermediaryCalculation',
				left: {
					type: 'IntermediaryNumber',
					value: '2',
				},
				operation: '/',
				right: {
					type: 'IntermediaryNumber',
					value: '3',
				},
			},
		],
		[
			() => IntermediaryNumber.Zero,
			{
				type: 'IntermediaryNumber',
				value: '0',
			},
		],
		[
			() => IntermediaryNumber.Zero.plus(1),
			{
				type: 'IntermediaryNumber',
				value: '1',
			},
		],
		[
			() => IntermediaryNumber.Zero.plus(1).minus(1),
			{
				type: 'IntermediaryNumber',
				value: '0',
			},
		],
		[
			() => new IntermediaryCalculation(
				IntermediaryNumber.Zero,
				'+',
				IntermediaryNumber.One,
			),
			{
				type: 'IntermediaryNumber',
				value: '1',
			},
			{
				type: 'IntermediaryNumber',
				value: '1',
			},
		],
		[
			() => new IntermediaryCalculation(
				IntermediaryNumber.One,
				'+',
				IntermediaryNumber.Zero,
			),
			{
				type: 'IntermediaryNumber',
				value: '1',
			},
			{
				type: 'IntermediaryNumber',
				value: '1',
			},
		],
		[
			() => IntermediaryCalculation.fromString('0 + 1'),
			{
				type: 'IntermediaryNumber',
				value: '1',
			},
		],
		[
			() => IntermediaryCalculation.fromString('1 + 0'),
			{
				type: 'IntermediaryNumber',
				value: '1',
			},
		],
		[
			() => IntermediaryCalculation.fromString('3 * 1'),
			{
				type: 'IntermediaryNumber',
				value: '3',
			},
		],
		[
			() => IntermediaryCalculation.fromString('3 * 2'),
			{
				type: 'IntermediaryCalculation',
				left: {
					type: 'IntermediaryNumber',
					value: '3',
				},
				operation: '*',
				right: {
					type: 'IntermediaryNumber',
					value: '2',
				},
			},
		],
		[
			() => (new IntermediaryCalculation(
				IntermediaryNumber.One,
				'+',
				IntermediaryCalculation.fromString('1/3')
			)),
			{
				type: 'IntermediaryCalculation',
				left: {
					type: 'IntermediaryNumber',
					value: '1',
				},
				operation: '+',
				right: {
					type: 'IntermediaryCalculation',
					left: {
						type: 'IntermediaryNumber',
						value: '1',
					},
					operation: '/',
					right: {
						type: 'IntermediaryNumber',
						value: '3',
					},
				},
			},
			{
				type: 'IntermediaryCalculation',
				left: {
					type: 'IntermediaryNumber',
					value: '4',
				},
				operation: '/',
				right: {
					type: 'IntermediaryNumber',
					value: '3',
				},
			},
		],
	];

	for (let index=0; index < data_sets.length; ++index) {
		const [generator, expectation, resolve_expectation] = data_sets[index];

		void it(
			`CanConvertType().toJSON() with dataset ${
				index
			} returns ${
				JSON.stringify(expectation)
			}`,
			() => {
				let value:CanConvertType|undefined;

				const get_value = () => {
					value = generator();
				};

				assert.doesNotThrow(get_value);

				not_undefined(value);

				assert.deepStrictEqual(
					value.toJSON(),
					expectation
				);

				if (resolve_expectation) {
					assert.deepStrictEqual(
						(value as (
							| IntermediaryCalculation
						)).resolve().toJSON(),
						resolve_expectation,
					);
				}
			}
		)
	}
})
