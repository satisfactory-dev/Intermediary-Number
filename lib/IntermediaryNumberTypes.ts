import type BigNumber from 'bignumber.js';
import type Fraction from 'fraction.js';

import type {
	numeric_string,
} from './NumberStrings.ts';

export type input_types = (
	| BigNumber
	| Fraction
	| number
	| string
);

export type value_types = (
	| BigNumber
	| Fraction
	| numeric_string
);

export type type_property_types = (
	| 'BigNumber'
	| 'Fraction'
	| 'amount_string'
	| 'numeric_string'
);
