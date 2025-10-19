// goal: api.resource(dynamicRoute).create(data)

import { ZodObject } from "zod";

export class ApiClient<TSchema extends ApiSchema> {
	[resource: string]: TSchema[keyof TSchema];

	constructor(schema: TSchema, baseUrl: string) {
		// Copy the schema structure to this instance
		for (const key in schema) {
			(this[key] as any) = schema[key];
		}

		// Populate URLs for each endpoint
		populateUrls(this, baseUrl);
	}
}

function populateUrls(resource: any, baseUrl: string) {
	for (const key in resource) {
		const item = resource[key];
		if (typeof item === "object" && item !== null) {
			populateUrls(item, `${baseUrl}/${key}`);
		} else {
			item.url = `${baseUrl}/${key}`;
		}
	}
}

export interface ApiSchema {
	[resource: string]: Resource;
}

export type Resource = {
	[subroute: string]: Resource | DynamicResource | Endpoint<any, any, any>;
};

export type DynamicResource = {
	url: string;
	[subroute: string]:
		| Resource
		| DynamicResource
		| Endpoint<any, any, any>
		| string;
};

interface EndpointFunction<
	TReturn,
	TBodySchema extends ZodObject | undefined,
	TSearchParamSchema extends ZodObject | undefined,
> {
	(
		body: TBodySchema extends ZodObject
			? TBodySchema["_zod"]["input"]
			: undefined,
		searchParams: TSearchParamSchema extends ZodObject
			? TSearchParamSchema["_zod"]["input"]
			: undefined,
	): Promise<TReturn>;
}

export type Endpoint<
	TReturn,
	TSchema extends ZodObject | undefined,
	TSearchParamSchema extends ZodObject | undefined,
> = EndpointFunction<ApiResponse<TReturn>, TSchema, TSearchParamSchema> & {
	url?: string;
	schema: TSchema;
};

export type ApiResponse<TReturn> = Omit<Response, "json"> & {
	json: () => Promise<TReturn>;
};

function fetchWrapper(
	url: string,
	method: "GET" | "POST" | "PUT" | "DELETE",
	body?: any,
) {
	return globalThis.fetch(url, {
		method,
		headers: {
			"Content-Type": "application/json",
		},
		body: body ? JSON.stringify(body) : undefined,
	});
}

function endpointMethod<
	TReturn,
	TBodySchema extends ZodObject | undefined,
	TSearchParamSchema extends ZodObject | undefined,
>(
	method: "GET" | "POST" | "PUT" | "DELETE",
	bodySchema: TBodySchema,
	searchParamSchema: TSearchParamSchema,
): Endpoint<TReturn, TBodySchema, TSearchParamSchema> {
	const endpoint = async (
		data: TBodySchema extends ZodObject
			? TBodySchema["_zod"]["input"]
			: undefined,
	) => {
		return fetchWrapper("http://example.com/api", method, data).then((res) => ({
			...res,
			json: () => res.json() as Promise<TReturn>,
		})) as Promise<ApiResponse<TReturn>>;
	};

	return Object.assign(endpoint, { schema: bodySchema });
}

export function GET<
	TReturn,
	TSearchParamSchema extends ZodObject | undefined = undefined,
>(
	searchParamSchema: TSearchParamSchema,
): Endpoint<TReturn, undefined, TSearchParamSchema> {
	return endpointMethod<TReturn, undefined, TSearchParamSchema>(
		"GET",
		undefined,
		searchParamSchema,
	);
}

export function POST<
	TReturn,
	TBodySchema extends ZodObject | undefined = undefined,
	TSearchParamSchema extends ZodObject | undefined = undefined,
>(
	bodySchema: TBodySchema,
	searchParamSchema: TSearchParamSchema,
): Endpoint<TReturn, TBodySchema, TSearchParamSchema> {
	return endpointMethod<TReturn, TBodySchema, TSearchParamSchema>(
		"POST",
		bodySchema,
		searchParamSchema,
	);
}

export function PUT<
	TReturn,
	TBodySchema extends ZodObject | undefined = undefined,
	TSearchParamSchema extends ZodObject | undefined = undefined,
>(
	bodySchema: TBodySchema,
	searchParamSchema: TSearchParamSchema,
): Endpoint<TReturn, TBodySchema, TSearchParamSchema> {
	return endpointMethod<TReturn, TBodySchema, TSearchParamSchema>(
		"PUT",
		bodySchema,
		searchParamSchema,
	);
}

export function DELETE<
	TReturn,
	TBodySchema extends ZodObject | undefined = undefined,
	TSearchParamSchema extends ZodObject | undefined = undefined,
>(
	bodySchema: TBodySchema,
	searchParamSchema: TSearchParamSchema,
): Endpoint<TReturn, TBodySchema, TSearchParamSchema> {
	return endpointMethod<TReturn, TBodySchema, TSearchParamSchema>(
		"DELETE",
		bodySchema,
		searchParamSchema,
	);
}
