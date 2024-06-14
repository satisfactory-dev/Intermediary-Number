import {
	describe,
	it,
} from 'node:test';
import assert from 'node:assert/strict';
import {
	not_undefined,
} from '@satisfactory-clips-archive/custom-assert/assert/CustomAssert';

import {
	CanDoMathWithDispose_operator_types,
	IntermediaryCalculation,
	IntermediaryNumber,
	math_types,
	TokenScan,
} from '../../lib/IntermediaryNumber';
import {
	expand_fraction_string,
	expand_ignore_characters,
	from_string_data_set,
	random_ignore_string,
} from '../utilities/expand-string-parsing';
import BigNumber from 'bignumber.js';
import Fraction from 'fraction.js';

const from_string_data_sets:from_string_data_set[] = [
	[
		'1',
		'IntermediaryNumber',
		'amount_string',
		'1',
	],
	[
		'1.2r',
		'IntermediaryNumber',
		'Fraction',
		'1.(2)',
	],
	...expand_fraction_string('1.1(23)'),
	...expand_ignore_characters([
		'1.1(23) + 1',
		'IntermediaryCalculation',
		'Fraction + amount_string',
		'2.1(23)',
	]),
	...expand_ignore_characters([
		'1.1(23) + 1 + 2',
		'IntermediaryCalculation',
		'IntermediaryCalculation + amount_string',
		'4.1(23)',
	]),
	...expand_ignore_characters([
		'1.1(23) + 1 * 2',
		'IntermediaryCalculation',
		'IntermediaryCalculation * amount_string',
		'4.2(46)',
	]),
	...expand_ignore_characters([
		'1.1(23) + (1 * 2)',
		'IntermediaryCalculation',
		'Fraction + IntermediaryCalculation',
		'3.1(23)',
	]),
	...expand_ignore_characters([
		'(1.1(23) + 1) * 2',
		'IntermediaryCalculation',
		'IntermediaryCalculation * amount_string',
		'4.2(46)',
	]),
	...expand_ignore_characters([
		'1 + 2 * 3 / 4 % 5 - 6 + 7 * 8 / 9',
		'IntermediaryCalculation',
		'IntermediaryCalculation / amount_string',
		'2.(8)',
	]),
	...expand_ignore_characters([
		'.1 - .2 + .3 * .4 / .5',
		'IntermediaryCalculation',
		'IntermediaryCalculation / amount_string',
		'0.16',
	]),
	...expand_ignore_characters([
		'3 x 5 % 9',
		'IntermediaryCalculation',
		'IntermediaryCalculation % amount_string',
		'6',
	]),
	...expand_ignore_characters([
		'1 + (2/3)',
		'IntermediaryCalculation',
		'amount_string + IntermediaryCalculation',
		'1.(6)',
	]),
	...expand_ignore_characters([
		'1 + 2',
		'IntermediaryCalculation',
		'amount_string + amount_string',
		'3',
	]),
	...expand_ignore_characters([
		'( ( 46.53r ) x ( 3 ) ) - ( 0 )',
		'IntermediaryCalculation',
		'IntermediaryCalculation - amount_string',
		'139.6',
	]),
	...expand_ignore_characters([
		'(((120 * .972322) * 3)+((120 * 1) * 1))/3',
		'IntermediaryCalculation',
		'IntermediaryCalculation / amount_string',
		'156.67864',
	]),
	...expand_ignore_characters([
		'(((120*.972322) * 3)+120)/3',
		'IntermediaryCalculation',
		'IntermediaryCalculation / amount_string',
		'156.67864',
	]),
	[
		// this caused issues with the old DeferredCalculation implementation
		// eslint-disable-next-line max-len
		'((((120 			   	*		 		  	   		 	 	 		  			   							 	 		  						.972322)	 		 		 		   	    	   	 	    		    		  	  			  	 					   	 	 	* 	  		  	   	  		 		 	 			 	   	3)+((120	  	  	 		  	 	 		  		 	 	 	 		  	  		  	 		 	 	   	 						   	 *				   	 			 	 	 		    1)			 	   	  			  	 				 	*					 			1))/3)',
		'IntermediaryCalculation',
		'IntermediaryCalculation / amount_string',
		'156.67864',
	],
	[
		// this caused issues with the old DeferredCalculation implementation
		// eslint-disable-next-line max-len
		'((((120  			  						  	      	  	 	  			 	 				  			  		*  	 			 			 		 				  	 	  	.972322)      		 				  	  			    		  	   	    		  	   	 	     	 		 			 	 		  			   		 		 	 	  		      	 	*	  			   	   	 	   			  	 	  	 	  		 	 	3)+((120				 							 	 			 	* 	  			     			  	    	   	 					   	  	 	1) 					 				    			 		  		 		  	 		 	  				 	   	  * 		 			  				 		 	     	     	  						 			   	  	 		      		  			 		 	  		 		   			 	          		 	1))/3)',
		'IntermediaryCalculation',
		'IntermediaryCalculation / amount_string',
		'156.67864',
	],
	...expand_ignore_characters([
		// naive parsing splits the two parts of the non-recurring decimal
		'15+5.84583r+25.6875',
		'IntermediaryCalculation',
		'IntermediaryCalculation + amount_string',
		'46.5(3)',
	]),
];

const from_string_data_sets_throwing:[
	string,
][] = [
	[''],
	['()'],
	['( )'],
	['(\t)'],
	['11 * ()'],
];

void describe('TokenScan', () => {
	void describe('parse', () => {
		for (const [
			input,
		] of from_string_data_sets_throwing) {
			void it(
				`(new TokenScan(${
					JSON.stringify(input)
				})).parsed throws`,
				() => {
					const scan = new TokenScan(input);

					assert.throws(() => scan.parsed);
					assert.strictEqual(
						scan.valid,
						false
					);
				}
			)
		}

		for (const [
			raw_input_string,
			expected_result_type,
			expected_type_info,
			expected_result_string,
		] of from_string_data_sets) {
			for (const input_string of [
				raw_input_string,
				`${random_ignore_string()}${raw_input_string}`,
				`${raw_input_string}${random_ignore_string()}`,
				`${random_ignore_string()}${raw_input_string}${random_ignore_string()}`,
			]) {
				const scan = new TokenScan(input_string);

				if (undefined === expected_result_type) {
					void it(
						`(new TokenScan(${
							JSON.stringify(input_string)
						})).parsed throws`,
						() => {
							assert.throws(
								() => scan.parsed
							);
							assert.strictEqual(
								scan.valid,
								false
							);
						}
					)
				} else {
					not_undefined(expected_type_info);
					void it(
						`(new TokenScan(${
							JSON.stringify(input_string)
						})).parsed behaves`,
						() => {
							const result = scan.parsed;
							assert.strictEqual(
								scan.valid,
								true
							);

							assert.strictEqual(
								result.constructor.name,
								expected_result_type
							);

							assert.strictEqual(
								result.resolve_type,
								expected_type_info
							);

							assert.strictEqual(
								result.toString(),
								expected_result_string
							);
						}
					)
				}
			}
		}
	})

	void describe('CanResolveMathWithDispose', () => {
		const data_sets:(
			| [
				string,
				[
					| 'abs'
					| 'resolve'
					| 'toAmountString'
					| 'toBigNumber'
					| 'toBigNumberOrFraction'
					| 'toFraction'
					| 'toString'
					| 'toStringCalculation'
				],
				string,
			]
			| [
				string,
				['compare', math_types],
				'-1'|'0'|'1',
			]
			| [
				string,
				['divide'|'minus'|'modulo'|'plus'|'times', math_types],
				string,
			]
			| [
				string,
				[
					'do_math_then_dispose',
					CanDoMathWithDispose_operator_types,
					math_types
				],
				string
			]
			| [
				string,
				['isGreaterThan'|'isLessThan', math_types],
				'false'|'true',
			]
			| [
				string,
				['isOne'|'isZero'],
				'false'|'true',
			]
			| [
				string,
				['max', math_types, ...math_types[]],
				string,
			]
		)[] = [
			['-1', ['abs'], '1'],
			['1', ['compare', IntermediaryNumber.One], '0'],
			['2 * 3', ['divide', 4], '1.5'],
			['2 * 3', ['do_math_then_dispose', 'divide', 4], '1.5'],
			['-1', ['isGreaterThan', IntermediaryNumber.Zero], 'false'],
			['-1', ['isLessThan', IntermediaryNumber.Zero], 'true'],
			['1+2/3', ['isOne'], 'true'],
			['1', ['isOne'], 'true'],
			['1+2/3', ['isZero'], 'false'],
			['0', ['isZero'], 'true'],
			['2 * 3', ['max', 1, 2], '6'],
			['-1', ['minus', 1], '-2'],
			['-1', ['minus', -1], '0'],
			['4/3', ['modulo', 1], '0.(3)'],
			['-1', ['plus', 1], '0'],
			['1+2/3', ['resolve'], '1'],
			['1', ['resolve'], '1'],
			['-1', ['times', 2], '-2'],
			['4/3', ['toAmountString'], '1.333334'],
			['4/3', ['toBigNumber'], '1.3333333333333333'],
			['4/3', ['toBigNumberOrFraction'], '1.(3)'],
			['4/3', ['toFraction'], '1.(3)'],
			['1+2/3', ['toString'], '1'],
			['1+2/-3', ['toString'], '-1'],
			['1+2/3', ['toStringCalculation'], '1+2/3'],
			['1 + 2 / 3', ['toStringCalculation'], '1 + 2 / 3'],
			['1+ 2 / 3', ['toStringCalculation'], '1+ 2 / 3'],
		];

		for (const [
			input,
			[
				method,
				...additional_args
			],
			expectation,
		] of data_sets) {
			void it(
				`(new TokenScan(${
					input
				})).${
					method
				}(${
					0 === additional_args.length
						? ''
						: additional_args.map(
							e => JSON.stringify(e)
						).join(', ')
				}).toString() === ${
					expectation
				}`,
				() => {
					const scan = new TokenScan(input);
					assert.strictEqual(
						scan.valid,
						true,
						'input not valid!'
					);

					let result:unknown;

					if (
						'abs' === method
						|| 'isOne' === method
						|| 'isZero' === method
						|| 'resolve' === method
						|| 'toAmountString' === method
						|| 'toBigNumber' === method
						|| 'toBigNumberOrFraction' === method
						|| 'toFraction' === method
						|| 'toString' === method
						|| 'toStringCalculation' === method
					) {
						result = scan[method]();
					} else if (
						'compare' === method
						|| 'divide' === method
						|| 'isGreaterThan' === method
						|| 'isLessThan' === method
						|| 'minus' === method
						|| 'modulo' === method
						|| 'plus' === method
						|| 'times' === method
					) {
						assert.strictEqual(
							additional_args.length,
							1,
							`Expecting 1 argument for ${
								method
							}, received ${
								additional_args.length
							}`
						);

						result = scan[method](additional_args[0]);
					} else if (
						'do_math_then_dispose' === method
					) {
						assert.strictEqual(
							additional_args.length,
							2,
							`Expecting 2 arguments for ${
								method
							}, received ${
								additional_args.length
							}`
						);

						result = scan[method](
							additional_args[
								0
							] as CanDoMathWithDispose_operator_types,
							additional_args[1]
						);
					} else if (
						'max' === method
					) {
						assert.strictEqual(
							additional_args.length >= 1,
							true,
							`Expecting at least 1 argument for ${
								method
							}, received ${
								additional_args.length
							}`
						);

						const [
							first,
							...remaining
						] = additional_args;

						result = scan[method](
							first as math_types,
							...remaining
						);
					}

					assert.strictEqual(
						(
							(result instanceof IntermediaryNumber)
							|| (result instanceof IntermediaryCalculation)
							|| (result instanceof TokenScan)
							|| (result instanceof BigNumber)
							|| (result instanceof Fraction)
							|| 'boolean' === typeof result
							|| 'string' === typeof result
							|| 'number' === typeof result
						),
						true,
						// eslint-disable-next-line max-len
						`Expecting either a boolean, string, number, or an appropriate class instance, received ${
							undefined === result
								? 'undefined'
								: (
									null === result
										? 'null'
										: (result).constructor.name
								)
						}`
					);

					assert.strictEqual(
						(
							result as (
								| IntermediaryNumber
								| IntermediaryCalculation
								| TokenScan
								| BigNumber
								| Fraction
								| boolean
								| string
								| number
							)
						).toString(),
						expectation
					);
				}
			)
		}
	})
})
