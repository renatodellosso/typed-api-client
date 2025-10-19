import { ZodObject } from "zod";
import { createUnfinalizedEndpoint, Endpoint } from "./endpoint";

export function GET<
	TReturn,
	TSearchParamSchema extends ZodObject | undefined = undefined,
>(config?: {
	searchParamSchema?: TSearchParamSchema;
}): Endpoint<TReturn, undefined, TSearchParamSchema> {
	return createUnfinalizedEndpoint<TReturn, undefined, TSearchParamSchema>(
		"GET",
		undefined,
		config?.searchParamSchema,
	);
}

export function POST<
	TReturn,
	TBodySchema extends ZodObject | undefined = undefined,
	TSearchParamSchema extends ZodObject | undefined = undefined,
>(config?: {
	bodySchema?: TBodySchema;
	searchParamSchema?: TSearchParamSchema;
}): Endpoint<TReturn, TBodySchema, TSearchParamSchema> {
	return createUnfinalizedEndpoint<TReturn, TBodySchema, TSearchParamSchema>(
		"POST",
		config?.bodySchema,
		config?.searchParamSchema,
	);
}

export function PUT<
	TReturn,
	TBodySchema extends ZodObject | undefined = undefined,
	TSearchParamSchema extends ZodObject | undefined = undefined,
>(config?: {
	bodySchema?: TBodySchema;
	searchParamSchema?: TSearchParamSchema;
}) {
	return createUnfinalizedEndpoint<TReturn, TBodySchema, TSearchParamSchema>(
		"PUT",
		config?.bodySchema,
		config?.searchParamSchema,
	);
}

export function DELETE<
	TReturn,
	TBodySchema extends ZodObject | undefined = undefined,
	TSearchParamSchema extends ZodObject | undefined = undefined,
>(config?: {
	bodySchema?: TBodySchema;
	searchParamSchema?: TSearchParamSchema;
}): Endpoint<TReturn, TBodySchema, TSearchParamSchema> {
	return createUnfinalizedEndpoint<TReturn, TBodySchema, TSearchParamSchema>(
		"DELETE",
		config?.bodySchema,
		config?.searchParamSchema,
	);
}
