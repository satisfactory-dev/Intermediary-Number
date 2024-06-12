// exports from Docs.json.ts not really warranting their own package

export class NotAnAmountString extends Error
{}

export type StringPassedRegExp<
	pattern extends string,
	T extends string = string,
> = T & {
	[pseudo_key in pattern]: never;
};

export type integer_string__type = StringPassedRegExp<'^\\d+$'>;

export function is_string(maybe: unknown): maybe is string {
	return 'string' === typeof maybe;
}
