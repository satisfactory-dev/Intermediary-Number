import assert from 'assert';
import BigNumber from 'bignumber.js';
import Fraction from 'fraction.js';
import {
	is_string,
} from './Docs.json';
import {
	amount_string,
	NumberStrings,
} from './NumberStrings';
import type {
	input_types,
	type_property_types,
	value_types,
} from './IntermediaryNumberTypes';

//#region Types

export type math_types =
	| operand_types
	| input_types;

export const regex_recurring_number =
	/^-?(\d+\.)(\d+r|\d*\[\d+\]r?|\d*\(\d+\)r?)$/;

export type CanDoMath_result_types =
	| IntermediaryNumber
	| IntermediaryCalculation
	| TokenScan;

export type operation_types =
	| '+'
	| '-'
	| '*'
	| 'x'
	| '/'
	| '%';

export type operand_type_property_types =
	| type_property_types
	| 'IntermediaryCalculation'
	| 'TokenScan';

export type CanConvertTypeJson =
	| {
		type: 'IntermediaryNumber',
		value: string,
	}
	| {
		type: 'IntermediaryCalculation',
		left: CanConvertTypeJson,
		operation: operation_types,
		right: CanConvertTypeJson,
	}
	| {
		type: 'TokenScan',
		value: string,
	};

export type CanDoMathWithDispose_operator_types =
	| 'divide'
	| 'minus'
	| 'modulo'
	| 'plus'
	| 'times';

export type operand_types =
	| IntermediaryNumber
	| IntermediaryCalculation
	| TokenScan;

//#region TokenScan types

type TokenSpan_types =
	| 'ignore'
	| 'nesting_open'
	| 'nesting_close'
	| 'numeric'
	| 'operation'

type TokenSpan_types_part_baked = Exclude<
	TokenSpan_types,
	| 'ignore'
>;

type TokenScan_internals = {
	parsed: IntermediaryNumber|IntermediaryCalculation|undefined,
	tokens: (TokenSpan<TokenSpan_types_part_baked>[])|undefined,
	valid: boolean|undefined,
};

type TokenScan_parsing_tokens = Omit<TokenScan, 'is_valid'|'tokens'|'parsed'>;
type TokenScan_parsing_value = Omit<TokenScan, 'is_valid'|'parsed'>;

type TokenScan_tokenizer_operand_buffer =
	| IntermediaryNumber
	| IntermediaryCalculation
	| undefined;

type incomplete_operation = {
	left_operand: Exclude<
		TokenScan_tokenizer_operand_buffer,
		undefined
	>,
	operation: operation_types,
}

type TokenScan_tokenizer = {
	outter_stack: (
		| incomplete_operation
		| TokenSpan<'nesting_open'>
	)[],
	left_operand: TokenScan_tokenizer_operand_buffer,
	right_operand: TokenScan_tokenizer_operand_buffer,
	operation: ''|operation_types,
	operand_mode: 'left'|'right',
}

//#endregion

//#endregion

//#region interfaces

interface HasType
{
	get type(): operand_type_property_types;
}

interface CanDoMath<
	ResultType extends CanDoMath_result_types = CanDoMath_result_types,
	ResolveString extends string = type_property_types
> extends HasType {
	get resolve_type(): ResolveString;

	compare(
		value:math_types
	): -1|0|1;

	divide(
		value:math_types
	): ResultType;

	minus(
		value:math_types
	): ResultType;

	modulo(
		value:math_types
	): ResultType;

	plus(
		value:math_types
	): ResultType;

	times(
		value:math_types
	): ResultType;

	abs(): (
		| operand_types
	);

	max(
		first: math_types,
		...remaining: math_types[]
	): operand_types;

	min(
		first: math_types,
		...remaining: math_types[]
	): operand_types;
}

interface CanResolveMath<
	T extends CanDoMath_result_types = CanDoMath_result_types
> extends CanDoMath<
	T,
	string
> {
	resolve(): IntermediaryNumber;
}

export interface CanConvertType extends HasType
{
	toAmountString(): amount_string;

	toBigNumber(): BigNumber;

	toBigNumberOrFraction(): BigNumber|Fraction;

	toFraction(): Fraction;

	toString(): string;

	isLessThan(value:math_types): boolean;

	isGreaterThan(value:math_types): boolean;

	isOne(): boolean;

	isZero(): boolean;

	toJSON(): CanConvertTypeJson;
}

interface CanDoMathWithDispose<
	ResultType extends CanDoMath_result_types = CanDoMath_result_types,
	ResolveString extends string = type_property_types
> extends CanConvertType, CanDoMath<
	ResultType,
	ResolveString
> {
	do_math_then_dispose(
		operator: CanDoMathWithDispose_operator_types,
		right_operand: math_types
	): ResultType;
}

interface CanResolveMathWithDispose<
	T extends CanDoMath_result_types = CanDoMath_result_types
> extends
	CanResolveMath<T>,
	CanDoMathWithDispose<T, string>
{
}

//#endregion

//#region utility functions

function do_math(
	left_operand: IntermediaryNumber|IntermediaryCalculation,
	operator: operation_types,
	right_operand: math_types,
) : operand_types {
	return IntermediaryCalculation.maybe_reduce_operands(
		left_operand,
		operator,
		IntermediaryNumber.reuse_or_create(right_operand),
	);
}

function abs(
	value:
		| operand_types,
): operand_types {
	if (value.isZero()) {
		return value;
	}

	return (value.isLessThan(0)
		? IntermediaryNumber.Zero.minus(
			value,
		)
		: value
	);
}

function compare(
	value: math_types,
	to: CanConvertType,
): 0|1|-1 {
	const comparable = IntermediaryNumber.reuse_or_create(
		value,
	).toBigNumberOrFraction();

	let result:number|null;

	if (comparable instanceof BigNumber) {
		result = to.toBigNumber().comparedTo(comparable);
	} else {
		result = to.toFraction().compare(comparable);
	}

	assert.strictEqual(
		(
			-1 === result
			|| 0 === result
			|| 1 === result
		),
		true,
		`Expecting -1, 0, or 1, receieved ${JSON.stringify(result)}`,
	);

	return result as -1|0|1;
}

const conversion_cache = new class {
	private toAmountString_cache:undefined|WeakMap<
		CanConvertType,
		amount_string
	>;
	private toBigNumber_cache:WeakMap<CanConvertType, BigNumber>|undefined;
	private toFraction_cache:WeakMap<CanConvertType, Fraction>|undefined;
	private toString_cache:WeakMap<CanConvertType, string>|undefined;

	get AmountString(): WeakMap<CanConvertType, amount_string>
	{
		if (!this.toAmountString_cache) {
			this.toAmountString_cache = new WeakMap();
		}

		return this.toAmountString_cache;
	}

	get BigNumber(): WeakMap<CanConvertType, BigNumber>
	{
		if (!this.toBigNumber_cache) {
			this.toBigNumber_cache = new WeakMap();
		}

		return this.toBigNumber_cache;
	}

	get Fraction(): WeakMap<CanConvertType, Fraction>
	{
		if (!this.toFraction_cache) {
			this.toFraction_cache = new WeakMap();
		}

		return this.toFraction_cache;
	}

	get String(): WeakMap<CanConvertType, string>
	{
		if (!this.toString_cache) {
			this.toString_cache = new WeakMap();
		}

		return this.toString_cache;
	}

	dispose(of:CanConvertType)
	{
		for (const cache of [
			this.toAmountString_cache,
			this.toBigNumber_cache,
			this.toFraction_cache,
			this.toString_cache,
		]) {
			if (cache) {
				cache.delete(of);
			}
		}
	}
}

export function dispose(value:operand_types)
{
	conversion_cache.dispose(value);
}

function max(
	first: math_types,
	second: math_types,
	...remaining: math_types[]
): operand_types {
	let max = IntermediaryNumber.reuse_or_create(first);

	for (const entry of [second, ...remaining]) {
		const maybe = IntermediaryNumber.reuse_or_create(entry);
		if (-1 === max.compare(maybe)) {
			max = maybe;
		}
	}

	return IntermediaryNumber.reuse_or_create(max);
}

function min(
	first: math_types,
	second: math_types,
	...remaining: math_types[]
): operand_types {
	let min = IntermediaryNumber.reuse_or_create(first);

	for (const entry of [second, ...remaining]) {
		const maybe = IntermediaryNumber.reuse_or_create(entry);
		if (-1 === maybe.compare(min)) {
			min = maybe;
		}
	}

	return IntermediaryNumber.reuse_or_create(min);
}

//#region TokenScan utility functions

function default_tokenizer_state(): TokenScan_tokenizer {
	return {
		outter_stack: [],
		left_operand: undefined,
		operation: '',
		right_operand: undefined,
		operand_mode: 'left',
	}
}

function is_nesting_open(
	maybe: TokenSpan<TokenSpan_types>,
): maybe is TokenSpan<'nesting_open'> {
	return 'nesting_open' === maybe.type;
}

function is_nesting_close(
	maybe: TokenSpan<TokenSpan_types>,
): maybe is TokenSpan<'nesting_close'> {
	return 'nesting_close' === maybe.type;
}

function is_numeric(
	maybe: TokenSpan<TokenSpan_types>,
): maybe is TokenSpan<'numeric'> {
	return 'numeric' === maybe.type;
}

export function is_operation_value(
	maybe: string,
): asserts maybe is operation_types {
	if (
		! (
			maybe.length === 1
			&& '+-/x*%'.includes(maybe)
		)
	) {
		throw new TokenScanError(
			`Expected operation value, found "${maybe}"`,
		)
	}
}

//#endregion

//#endregion

//#region IntermediaryNumber

export class IntermediaryNumber implements CanDoMathWithDispose
{
	private readonly value:value_types;

	static readonly One = new this('1');

	static readonly Zero = new this('0');

	protected constructor(value:value_types)
	{
		this.value = value;
	}

	get resolve_type(): type_property_types {
		return this.type;
	}

	get type(): type_property_types
	{
		if (this.value instanceof BigNumber) {
			return 'BigNumber';
		} else if (this.value instanceof Fraction) {
			return 'Fraction';
		} else if (NumberStrings.is_amount_string(this.value)) {
			return 'amount_string';
		}

		return 'numeric_string';
	}

	abs()
	{
		return abs(this);
	}

	compare(value: math_types): 0 | 1 | -1 {
		return compare(value, this);
	}

	divide(value:math_types)
	{
		return do_math(this, '/', value);
	}

	do_math_then_dispose(
		operator: CanDoMathWithDispose_operator_types,
		right_operand: math_types,
	): CanDoMath_result_types {
		const result = this[operator](right_operand);

		if (result !== this) {
			dispose(this);
		}

		return result;
	}

	isGreaterThan(value: math_types): boolean {
		return 1 === this.compare(value);
	}

	isLessThan(value: math_types): boolean {
		return -1 === this.compare(value);
	}

	isOne(): boolean
	{
		return 0 === this.compare(1);
	}

	isZero(): boolean {
		return 0 === this.compare(0);
	}

	max(
		first: math_types,
		...remaining: math_types[]
	): operand_types {
		return max(this, first, ...remaining);
	}

	min(
		first: math_types,
		...remaining: math_types[]
	): operand_types {
		return min(this, first, ...remaining);
	}

	minus(value:math_types)
	{
		return do_math(this, '-', value);
	}

	modulo(value:math_types)
	{
		return do_math(this, '%', value);
	}

	plus(value:math_types)
	{
		if (this.isZero()) {
			return IntermediaryNumber.reuse_or_create(value);
		}

		return do_math(this, '+', value);
	}

	times(value:math_types)
	{
		return do_math(this, 'x', value);
	}

	toAmountString(): amount_string
	{
		if (NumberStrings.is_amount_string(this.value)) {
			return this.value;
		}

		return NumberStrings.round_off(this.toBigNumberOrFraction());
	}

	toBigNumber(): BigNumber
	{
		if (this.value instanceof BigNumber) {
			return this.value;
		} else if (this.value instanceof Fraction) {
			return BigNumber(this.value.valueOf());
		}

		const cache = conversion_cache.BigNumber;

		if (cache.has(this)) {
			return cache.get(this) as BigNumber;
		}

		const value = BigNumber(this.value);
		cache.set(this, value);

		return value;
	}

	toBigNumberOrFraction(): BigNumber | Fraction {
		return ('Fraction' === this.type)
			? this.toFraction()
			: this.toBigNumber();
	}

	toFraction(): Fraction
	{
		if (this.value instanceof Fraction) {
			return this.value;
		}

		const cache = conversion_cache.Fraction;

		if (cache.has(this)) {
			return cache.get(this) as Fraction;
		}

		const value = new Fraction(this.toString());
		cache.set(this, value);

		return value;
	}

	toJSON(): CanConvertTypeJson {
		if (this.isOne()) {
			return {
				type: 'IntermediaryNumber',
				value: '1',
			};
		} else if (this.isZero()) {
			return {
				type: 'IntermediaryNumber',
				value: '0',
			};
		}

		if (this.value instanceof Fraction) {
			const [left, right] = this.value.toFraction().split('/');

			if (undefined === right) {
				return {
					type: 'IntermediaryNumber',
					value: left,
				};
			}

			return {
				type: 'IntermediaryCalculation',
				left: {
					type: 'IntermediaryNumber',
					value: left,
				},
				operation: '/',
				right: {
					type: 'IntermediaryNumber',
					value: right,
				},
			};
		} else if (this.value instanceof BigNumber) {
			return {
				type: 'IntermediaryNumber',
				value: this.value.toFixed(),
			};
		}

		return {
			type: 'IntermediaryNumber',
			value: this.value,
		};
	}

	toString()
	{
		if (this.value instanceof BigNumber) {
			return this.value.toFixed();
		}

		return this.value.toString();
	}

	toStringCalculation()
	{
		return this.toString();
	}

	static create(
		input: input_types,
	): IntermediaryNumber {
		if ('' === input) {
			return IntermediaryNumber.Zero;
		}

		if (input instanceof Fraction) {
			return new this(input.simplify(1 / (2 ** 52)));
		}
		if (
			input instanceof BigNumber
			|| NumberStrings.is_numeric_string(input)
		) {
			return new this(input);
		} else if ('number' === typeof input) {
			return new this(BigNumber(input));
		} else if (is_string(input) && regex_recurring_number.test(input)) {
			let only_last_digit_recurring = false;
			if (/^\d*\.\d+r$/.test(input)) {
				only_last_digit_recurring = true;
			}

			if (input.endsWith('r')) {
				input = input.substring(0, input.length - 1);
			}

			if (only_last_digit_recurring) {
				input = input.replace(/(\d)$/, '($1)');
			} else if (input.includes('[')) {
				input = input.replace(/\[(\d+)\]/, '($1)');
			}

			return new this(new Fraction(input));
		}

		throw new Error('Unsupported argument specified!');
	}

	static create_if_valid(
		input:string,
	): operand_types|NotValid {
		const maybe = input.trim();

		if (
			NumberStrings.is_amount_string(maybe)
			|| NumberStrings.is_numeric_string(maybe)
		) {
			return IntermediaryNumber.create(maybe)
		} else if (
			/^(\d+|\d*\.\d+)\s*[+/*x%-]\s*(\d+|\d*\.\d+)$/.test(maybe)
		) {
			return TokenScan.create(input).parsed;
		}

		const scientific = /^(-?\d+(?:\.\d+))e([+-])(\d+)$/.exec(maybe);

		if (scientific) {
			const calc = new IntermediaryCalculation(
				IntermediaryNumber.Zero,
				scientific[2] as '+'|'-',
				IntermediaryNumber.create(scientific[3]),
			).toBigNumber();

			return IntermediaryNumber.create(scientific[1]).times(
				(new BigNumber(10)).pow(calc),
			);
		}

		try {
			return IntermediaryCalculation.fromString(maybe);
		} catch (err) {
			return new NotValid(maybe, err);
		}
	}

	static fromJson(json:CanConvertTypeJson): CanDoMath_result_types {
		if ('IntermediaryNumber' === json.type) {
			return this.create(json.value);
		} else if ('TokenScan' === json.type) {
			return TokenScan.create(json.value);
		}

		return new IntermediaryCalculation(
			this.fromJson(json.left),
			json.operation,
			this.fromJson(json.right),
		);
	}

	static reuse_or_create(
		input:
			| operand_types
			| input_types,
	): operand_types {
		return (
			(
				(input instanceof IntermediaryNumber)
				|| (input instanceof IntermediaryCalculation)
				|| (input instanceof TokenScan)
			)
				? input
				: this.create(input)
		);
	}
}

//#endregion

//#region IntermediaryCalculation

export class NotValid extends Error
{
	readonly reason: unknown;
	readonly value:string;

	constructor(not_valid:string, reason:unknown)
	{
		super('Value given was not valid!');

		this.value = not_valid;
		this.reason = reason;
	}
}

const BigNumber_operation_map:{
	[
		key in Exclude<
			operation_types,
			'/'
		>
	]: ((a: BigNumber, b:BigNumber) => BigNumber)
} = {
	'+': (a, b) => a.plus(b),
	'-': (a, b) => a.minus(b),
	'x': (a, b) => a.times(b),
	'*': (a, b) => a.times(b),
	'%': (a, b) => a.modulo(b),
};

const Fraction_operation_map:{
	[
		key in operation_types
	]: ((a: Fraction, b:Fraction) => Fraction)
} = {
	'+': (a, b) => a.add(b),
	'-': (a, b) => a.sub(b),
	'x': (a, b) => a.mul(b),
	'*': (a, b) => a.mul(b),
	'/': (a, b) => a.div(b),
	'%': (a, b) => a.mod(b),
};

export class IntermediaryCalculation implements CanResolveMathWithDispose
{
	readonly left_operand:operand_types;
	readonly operation:operation_types;
	readonly right_operand:operand_types;

	constructor(
		left:operand_types,
		operation:operation_types,
		right:operand_types,
	) {
		this.left_operand = left;
		this.operation = operation;
		this.right_operand = right;
	}

	get left_type(): operand_type_property_types
	{
		if (this.left_operand instanceof IntermediaryCalculation) {
			return 'IntermediaryCalculation';
		}

		return this.left_operand.type;
	}

	get resolve_type(): string {
		return `${this.left_type} ${this.operation} ${this.right_type}`;
	}

	get right_type(): operand_type_property_types
	{
		if (this.right_operand instanceof IntermediaryCalculation) {
			return 'IntermediaryCalculation';
		}

		return this.right_operand.type;
	}

	get type(): operand_type_property_types
	{
		return 'IntermediaryCalculation';
	}

	abs()
	{
		return abs(this);
	}

	compare(value: math_types): 0 | 1 | -1 {
		return compare(value, this);
	}

	divide(value:math_types)
	{
		return do_math(this, '/', value);
	}

	do_math_then_dispose(
		operator: CanDoMathWithDispose_operator_types,
		right_operand: math_types,
	): CanDoMath_result_types {
		const result = this[operator](right_operand);

		if (result !== this) {
			dispose(this);
		}

		return result;
	}

	isGreaterThan(value: math_types): boolean {
		return 1 === this.compare(value);
	}

	isLessThan(value: math_types): boolean {
		return -1 === this.compare(value);
	}

	isOne(): boolean {
		return 0 === this.compare(1);
	}

	isZero(): boolean {
		return 0 === this.compare(0);
	}

	max(
		first: math_types,
		...remaining: math_types[]
	): operand_types {
		return max(this, first, ...remaining);
	}

	min(
		first: math_types,
		...remaining: math_types[]
	): operand_types {
		return min(this, first, ...remaining);
	}

	minus(value:math_types)
	{
		return do_math(this, '-', value);
	}

	modulo(value:math_types)
	{
		return do_math(this, '%', value);
	}

	plus(value:math_types)
	{
		if (this.isZero()) {
			return IntermediaryNumber.reuse_or_create(value);
		}

		return do_math(this, '+', value);
	}

	resolve(): IntermediaryNumber
	{
		const left_operand = this.operand_to_IntermediaryNumber(
			this.left_operand,
		);
		const right_operand = this.operand_to_IntermediaryNumber(
			this.right_operand,
		);
		const left = left_operand.toBigNumberOrFraction();
		const right = right_operand.toBigNumberOrFraction();

		if (
			'/' === this.operation
			|| left instanceof Fraction
			|| right instanceof Fraction
		) {
			return IntermediaryNumber.create(
				Fraction_operation_map[this.operation](
					(
						(left instanceof BigNumber)
							? left_operand.toFraction()
							: left
					),
					(
						(right instanceof BigNumber)
							? right_operand.toFraction()
							: right
					),
				),
			);
		}

		return IntermediaryNumber.create(
			BigNumber_operation_map[this.operation](
				left,
				right,
			),
		);
	}

	times(value:math_types)
	{
		return do_math(this, 'x', value);
	}

	toAmountString(): amount_string {
		const cache = conversion_cache.AmountString;

		if (cache.has(this)) {
			return cache.get(this) as amount_string;
		}

		const value = this.resolve().toAmountString();
		cache.set(this, value);

		return value;
	}

	toBigNumber(): BigNumber {
		const cache = conversion_cache.BigNumber;

		if (cache.has(this)) {
			return cache.get(this) as BigNumber;
		}

		const value = this.resolve().toBigNumber()
		cache.set(this, value);

		return value;
	}

	toBigNumberOrFraction(): BigNumber | Fraction {
		return this.resolve().toBigNumberOrFraction();
	}

	toFraction(): Fraction {
		const cache = conversion_cache.Fraction;

		if (cache.has(this)) {
			return cache.get(this) as Fraction;
		}

		const value = this.resolve().toFraction();
		cache.set(this, value);

		return value;
	}

	toJSON(): CanConvertTypeJson {
		const left = this.operand_to_IntermediaryNumber(
			this.left_operand,
		);

		const right = this.operand_to_IntermediaryNumber(
			this.right_operand,
		);

		const maybe = IntermediaryCalculation.maybe_short_circuit(
			left,
			this.operation,
			right,
		);

		if (maybe) {
			return maybe.toJSON();
		}

		return {
			type: 'IntermediaryCalculation',
			left: left.toJSON(),
			operation: this.operation,
			right: right.toJSON(),
		}
	}

	toString(): string {
		const cache = conversion_cache.String;

		if (cache.has(this)) {
			return cache.get(this) as string;
		}

		const value = this.resolve().toString();
		cache.set(this, value);

		return value;
	}

	toStringCalculation(): string
	{
		return `${
			(this.left_operand instanceof IntermediaryCalculation)
				? `(${this.left_operand.toStringCalculation()})`
				: this.left_operand.toString()
		} ${
			this.operation
		} ${
			(this.right_operand instanceof IntermediaryCalculation)
				? `(${this.right_operand.toStringCalculation()})`
				: this.right_operand.toString()
		}`
	}

	private operand_to_IntermediaryNumber(
		operand:operand_types,
	) : IntermediaryNumber {
		if (
			(operand instanceof IntermediaryCalculation)
			|| (operand instanceof TokenScan)
		) {
			return operand.resolve();
		} else if (
			'amount_string' === operand.type
			|| 'numeric_string' === operand.type
		) {
			return IntermediaryNumber.create(
				'/' === this.operation
					? operand.toFraction()
					: operand.toBigNumberOrFraction(),
			);
		}

		return operand;
	}

	static fromString(
		input:Exclude<string, ''>,
	): IntermediaryNumber|IntermediaryCalculation {
		return TokenScan.create(input).parsed;
	}

	static is(maybe: unknown): maybe is IntermediaryCalculation
	{
		return maybe instanceof this;
	}

	static maybe_reduce_operands(
		left:operand_types,
		operation:operation_types,
		right:operand_types,
	) {
		let value:operand_types|undefined = this.maybe_short_circuit(
			left,
			operation,
			right,
		);

		if (undefined === value) {
			value = new IntermediaryCalculation(left, operation, right);
		}

		if (value instanceof IntermediaryCalculation) {
			return value.resolve();
		}

		return value;
	}

	static require_is(maybe: unknown): asserts maybe is IntermediaryCalculation
	{
		if (!this.is(maybe)) {
			throw new Error(
				'Argument is not an instanceof IntermediaryCalculation',
			);
		}
	}

	private static maybe_short_circuit(
		left:operand_types,
		operation:operation_types,
		right:operand_types,
	) {
		let value:operand_types|undefined = undefined;

		if ('+' === operation) {
			if (left.isZero()) {
				value = right;
			} else if (right.isZero()) {
				value = left;
			}
		} else if ('-' === operation && right.isZero()) {
			value = left;
		} else if ('*x'.includes(operation)) {
			if (left.isZero() || right.isOne()) {
				value = left;
			} else if (right.isZero() || left.isOne()) {
				value = right;
			}
		} else if ('/' === operation && right.isOne()) {
			value = left;
		}

		return value;
	}
}

//#endregion

//#region TokenScan

class TokenSpan<T = TokenSpan_types>
{
	readonly from:number;
	readonly to:number;
	readonly type:T;

	constructor(from:number, to:number, type:T)
	{
		this.from = from;
		this.to = to;
		this.type = type;
	}
}

export class TokenScanError extends Error
{
}

export class TokenScanParseError extends Error
{
	readonly current?: TokenSpan<TokenSpan_types>;
	readonly scan: TokenScan_parsing_value;
	readonly state?: TokenScan_tokenizer;

	constructor(
		message:string,
		scan: TokenScan_parsing_value,
		state: TokenScan_tokenizer,
		current?: TokenSpan<TokenSpan_types>,
	) {
		super(message);

		this.scan = scan;
		this.state = state;
		this.current = current;
	}
}

const regex_numeric = (
	/(?:\d*\.\d*\(\d+\)r?|\d*\.\d*\[\d+\]r?|\d+(?:\.\d+r)?|\.\d+r?)/g
);

export class TokenScan implements CanResolveMathWithDispose
{
	private readonly internal:TokenScan_internals = {
		parsed: undefined,
		tokens: undefined,
		valid: undefined,
	};

	readonly value:string|[TokenScan, operation_types, math_types];

	private constructor(
		value:| string|[TokenScan, operation_types, math_types])
	{
		this.value = value;
	}

	get parsed(): Exclude<TokenScan_internals['parsed'], undefined>
	{
		if (undefined === this.internal.parsed) {
			this.internal.parsed = TokenScan.parse_scan(this);
		}

		return this.internal.parsed;
	}

	get resolve_type(): string {
		return this.parsed.resolve_type;
	}

	get tokens(): Exclude<TokenScan_internals['tokens'], undefined>
	{
		if (undefined === this.internal.tokens) {
			this.internal.tokens = TokenScan.determine_tokens_from_scan(this);
		}

		return this.internal.tokens;
	}

	get type(): operand_type_property_types {
		return 'TokenScan';
	}

	get valid(): boolean
	{
		if (undefined === this.internal.valid) {
			try {
				this.parsed;
				this.internal.valid = true;
			} catch (err) {
				this.internal.valid = false;
			}
		}

		return this.internal.valid;
	}

	abs() {
		return this.parsed.abs();
	}

	compare(value: math_types): 0 | 1 | -1 {
		return this.parsed.compare(value);
	}

	divide(value: math_types): TokenScan {
		if (IntermediaryNumber.reuse_or_create(value).isOne()) {
			return this;
		}

		return new TokenScan([
			this,
			'/',
			value,
		]);
	}

	do_math_then_dispose(
		operator: CanDoMathWithDispose_operator_types,
		right_operand: math_types,
	): CanDoMath_result_types {
		const result = this.parsed.do_math_then_dispose(
			operator,
			right_operand,
		);
		this.internal.parsed = undefined;

		return result;
	}

	isGreaterThan(value: math_types): boolean {
		return this.parsed.isGreaterThan(value);
	}

	isLessThan(value: math_types): boolean {
		return this.parsed.isLessThan(value);
	}

	isOne(): boolean {
		return (
			(
				is_string(this.value)
				&& '1' === this.value.trim()
			)
			|| this.parsed.isOne()
		);
	}

	isZero(): boolean {
		return (
			(
				is_string(this.value)
				&& '0' === this.value.trim()
			)
			|| this.parsed.isZero()
		);
	}

	max(first: math_types, ...remaining: math_types[]): operand_types {
		return this.parsed.max(first, ...remaining);
	}

	min(first: math_types, ...remaining: math_types[]): operand_types {
		return this.parsed.min(first, ...remaining);
	}

	minus(value: math_types): TokenScan {
		if (IntermediaryNumber.reuse_or_create(value).isZero()) {
			return this;
		}

		return new TokenScan([
			this,
			'-',
			value,
		]);
	}

	modulo(value: math_types): TokenScan {
		return new TokenScan([
			this,
			'%',
			value,
		]);
	}

	plus(value: math_types): TokenScan {
		if (IntermediaryNumber.reuse_or_create(value).isZero()) {
			return this;
		}

		return new TokenScan([
			this,
			'+',
			value,
		]);
	}

	resolve(): IntermediaryNumber {
		const parsed = this.parsed;

		return IntermediaryCalculation.is(parsed) ? parsed.resolve() : parsed;
	}

	times(value: math_types): TokenScan {
		if (IntermediaryNumber.reuse_or_create(value).isOne()) {
			return this;
		}

		return new TokenScan([
			this,
			'x',
			value,
		]);
	}

	toAmountString(): amount_string {
		return this.parsed.toAmountString();
	}

	toBigNumber(): BigNumber {
		return this.parsed.toBigNumber();
	}

	toBigNumberOrFraction(): BigNumber | Fraction {
		return this.parsed.toBigNumberOrFraction();
	}

	toFraction(): Fraction {
		return this.parsed.toFraction();
	}

	toJSON(): CanConvertTypeJson {
		return {
			type: 'TokenScan',
			value: this.toStringCalculation(),
		};
	}

	toString(): string {
		return this.parsed.toString();
	}

	toStringCalculation(): string
	{
		if (this.value instanceof Array) {
			const left_operand = this.value[0];
			const right_operand = IntermediaryNumber.reuse_or_create(
				this.value[2],
			);

			return `${
				(left_operand.parsed instanceof IntermediaryNumber)
					? left_operand.toString()
					: `(${
						left_operand.toStringCalculation()
					})`
			} ${
				this.value[1]
			} ${
				(right_operand instanceof IntermediaryNumber)
					? right_operand.toStringCalculation()
					: `(${right_operand.toStringCalculation()})`
			}`;
		}

		return this.value;
	}

	static create(value:string): TokenScan
	{
		return new TokenScan(value);
	}

	static is(maybe: unknown): maybe is TokenScan
	{
		return maybe instanceof TokenScan;
	}

	static require_is(maybe: unknown): asserts maybe is TokenScan
	{
		if (!this.is(maybe)) {
			throw new Error(
				'Argument is not an instanceof TokenScan',
			);
		}
	}

	private static determine_tokens_from_scan(
		scan: TokenScan_parsing_tokens,
	): Exclude<TokenScan_internals['tokens'], undefined> {

		let tokens:TokenSpan<TokenSpan_types>[] = [];

		const value = scan.toStringCalculation();

		for (const entry of value.matchAll(/([\s]+)/g)) {
			tokens.push(new TokenSpan(
				entry.index,
				entry.index + entry[0].length,
				'ignore',
			));
		}

		for (const entry of value.matchAll(regex_numeric)) {
			tokens.push(new TokenSpan(
				entry.index,
				entry.index + entry[0].length,
				'numeric',
			));
		}

		for (const entry of value.matchAll(/([+/*x%-])/g)) {
			tokens.push(new TokenSpan(
				entry.index,
				entry.index + entry[0].length,
				'operation',
			));
		}

		for (const entry of value.matchAll(/(\()/g)) {
			tokens.push(new TokenSpan(
				entry.index,
				entry.index + entry[0].length,
				'nesting_open',
			));
		}

		for (const entry of value.matchAll(/(\))/g)) {
			tokens.push(new TokenSpan(
				entry.index,
				entry.index + entry[0].length,
				'nesting_close',
			));
		}

		tokens = tokens.sort((a, b) => {
			return a.from - b.from;
		})

		const recursive_numerics = tokens.filter(
			maybe => (
				'numeric' === maybe.type
				&& /[()]/.test(value.substring(maybe.from, maybe.to))
			),
		);

		tokens = tokens.filter(
			(maybe) => {
				if (
					'nesting_open' === maybe.type
					|| 'nesting_close' === maybe.type
				) {
					return !recursive_numerics.find(
						maybe_numeric => (
							maybe.from >= maybe_numeric.from
							&& maybe.to <= maybe_numeric.to
						),
					)
				}

				return true;
			},
		);

		if (tokens.length < 1) {
			throw new TokenScanError('No tokens found!')
		} else if (0 !== tokens[0].from) {
			throw new TokenScanError('First token not at index 0!')
		} else if (value.length !== tokens[tokens.length - 1].to) {
			throw new TokenScanError(
				'Last token does not end at end of string!',
			)
		}

		let nesting_balance = 0;

		for (let index=0; index<tokens.length; ++index) {
			const token = tokens[index];
			if ('nesting_open' === token.type) {
				nesting_balance += (token.to - token.from);
			} else if ('nesting_close' === token.type) {
				nesting_balance -= (token.to - token.from);
			}

			if (
				index > 0
				&& tokens[index - 1].to !== token.from
			) {
				console.error(tokens, index);
				throw new TokenScanError(
					`Token expected to be found at index ${index}`,
				)
			}
		}

		if (0 !== nesting_balance) {
			throw new TokenScanError(
				'Imbalanced nesting in string!',
			);
		}

		return this.massage_part_baked_tokens(
			scan,
			tokens.filter(
				(maybe): maybe is TokenSpan<
					TokenSpan_types_part_baked
				> => 'ignore' !== maybe.type,
			),
		);
	}

	private static massage_part_baked_tokens(
		scan: TokenScan_parsing_tokens,
		tokens: Exclude<TokenScan_internals['tokens'], undefined>,
	): Exclude<TokenScan_internals['tokens'], undefined> {
		const smoosh_numerics:number[] = [];

		const value = scan.toStringCalculation();

		for (
			let token_index=tokens.length - 1; token_index > 0; --token_index
		) {
			const previous = tokens[token_index - 1];
			const current = tokens[token_index];

			if ('numeric' === previous.type) {
				const previous_value = value.substring(
					previous.from,
					previous.to,
				);
				const current_value = value.substring(
					current.from,
					current.to,
				);

				if (
					current_value.startsWith('.')
					&& /^\d+$/.test(previous_value)
				) {
					smoosh_numerics.push(token_index);
				}
			}
		}

		for (const index of smoosh_numerics) {
			tokens.splice(
				index - 1,
				2,
				new TokenSpan(
					tokens[index - 1].from,
					tokens[index].to,
					'numeric',
				),
			);
		}

		const convert_to_negative:number[] = [];

		if (
			tokens.length >= 2
			&& 'operation' === tokens[0].type
			&& '-' === value[tokens[0].from]
			&& 'numeric' === tokens[1].type
		) {
			convert_to_negative.push(0);
		}

		for (
			let token_index=0; token_index < tokens.length; ++token_index
		) {
			const token = tokens[token_index];
			const next = tokens[token_index + 1];
			const after = tokens[token_index + 2];

			if (
				(
					'nesting_open' === token.type
					|| 'operation' === token.type
				)
				&& next
				&& after
				&& 'operation' === next.type
				&& '-' === value[next.from]
				&& 'numeric' === after.type
			) {
				convert_to_negative.push(token_index + 1);
				token_index += 2;
				continue;
			}
		}

		for (const index of convert_to_negative.reverse()) {
			tokens.splice(
				index,
				2,
				new TokenSpan(
					tokens[index].from,
					tokens[index + 1].to,
					'numeric',
				),
			);
		}

		return tokens;
	}

	private static parse_scan(
		scan: TokenScan_parsing_value,
	): IntermediaryNumber|IntermediaryCalculation {
		const reduced = scan.tokens.reduce(
			(
				was:TokenScan_tokenizer,
				is:TokenSpan<TokenSpan_types_part_baked>,
				index:number,
			) => TokenScan.reduce(
				scan,
				was,
				is,
				index,
			),
			default_tokenizer_state(),
		);

		if (
			undefined !== reduced.left_operand
			&& '' === reduced.operation
			&& undefined === reduced.right_operand
			&& 0 === reduced.outter_stack.length
		) {
			return reduced.left_operand;
		}

		throw new TokenScanParseError(
			'Parse in unsupported state!',
			scan,
			reduced,
		);
	}

	private static reduce(
		scan: TokenScan_parsing_value,
		was:TokenScan_tokenizer,
		is:TokenSpan<TokenSpan_types_part_baked>,
		index:number,
	): TokenScan_tokenizer {
		const value = scan.toStringCalculation();

		if (is_nesting_open(is)) {
			if ('right' === was.operand_mode) {
				if (undefined === was.left_operand) {
					if (
						! (
							was.outter_stack.length > 0
							&& ! (
								was.outter_stack[
									was.outter_stack.length - 1
								] instanceof TokenSpan
							)
						)
					) {
						throw new TokenScanParseError(
							// eslint-disable-next-line max-len
							'Nesting opened without left operand to push into stack!',
							scan,
							was,
						);
					}

					return was;
				} else if ('' === was.operation) {
					throw new TokenScanParseError(
						'Nesting opened without operation to push into stack!',
						scan,
						was,
						is,
					);
				}

				was.outter_stack.push({
					left_operand: was.left_operand,
					operation: was.operation,
				});
				was.left_operand = undefined;
				was.operation = '';
				was.operand_mode = 'left';
			} else {
				was.outter_stack.push(is);
			}
		} else if (is_nesting_close(is)) {
			const popped = was.outter_stack.pop();

			if (popped instanceof TokenSpan) {
				if (
					'nesting_open' === popped.type
					&& '' === was.operation
					&& undefined !== was.left_operand
					&& undefined === was.right_operand
				) {
					// no-op, deliberately do nothing
				} else {
					throw new TokenScanParseError(
						// eslint-disable-next-line max-len
						'token span popping in this context not yet implemented',
						scan,
						was,
						is,
					);
				}
			} else if (undefined === popped) {
				if (
					index !== (scan.tokens.length - 1)
					&& (
						'' !== was.operation
						|| undefined !== was.right_operand
					)
				) {
					throw new TokenScanParseError(
						'Token scan finished with incomplete parse!',
						scan,
						was,
						is,
					);
				}
			} else {
				if (
					'' === was.operation
					&& undefined !== was.left_operand
					&& undefined === was.right_operand
				) {
					was.left_operand = new IntermediaryCalculation(
						popped.left_operand,
						popped.operation,
						was.left_operand,
					);
					was.operation ='';
					was.operand_mode = 'right';
				} else {
					throw new TokenScanParseError(
						// eslint-disable-next-line max-len
						'token span popping in this context not yet implemented',
						scan,
						was,
						is,
					);
				}
			}
		} else if (is_numeric(is)) {
			if ('left' === was.operand_mode) {
				was.left_operand = IntermediaryNumber.create(
					value.substring(
						is.from,
						is.to,
					),
				);
				was.operand_mode = 'right';
			} else {
				if ('' === was.operation) {
					throw new TokenScanParseError(
						'Right operand detected without operation!',
						scan,
						was,
						is,
					);
				} else if (undefined === was.left_operand) {
					throw new TokenScanParseError(
						'Right operand detected without left operand!',
						scan,
						was,
						is,
					);
				}

				let resolved = new IntermediaryCalculation(
					was.left_operand,
					was.operation,
					IntermediaryNumber.create(value.substring(
						is.from,
						is.to,
					)),
				);

				if (
					was.outter_stack.length > 0
					&& ! (
						was.outter_stack[
							was.outter_stack.length - 1
						] instanceof TokenSpan
					)
				) {
					const previous = (
						was.outter_stack.pop()
					) as incomplete_operation;

					resolved = new IntermediaryCalculation(
						previous.left_operand,
						previous.operation,
						resolved,
					);
				}

				was.left_operand = resolved;
				was.operation = '';
				was.right_operand = undefined;
			}
		} else if ('operation' === is.type) {
			if (undefined === was.left_operand) {
				throw new TokenScanParseError(
					'Operation detected without left operand!',
					scan,
					was,
					is,
				);
			} else if ('' !== was.operation) {
				throw new TokenScanParseError(
					`Cannot set operation when operation already set to "${
						was.operation
					}"`,
					scan,
					was,
					is,
				)
			}
			const maybe = value.substring(is.from, is.to);
			is_operation_value(maybe);

			was.operation = maybe;
		} else {
			throw new TokenScanParseError(
				'not implemented',
				scan,
				was,
				is,
			);
		}

		return was;
	}
}

//#endregion
