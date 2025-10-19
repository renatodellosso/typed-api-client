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

		if (isEndpoint(item)) {
			item.url = baseUrl;
			resource[key] = finalizeEndpoint(item);
		} else if (typeof item === "object" && item !== null) {
			populateUrls(item, `${baseUrl}/${key}`);
		} else {
			throw new Error(`Invalid schema item at ${baseUrl}/${key}`);
		}
	}
}

function isEndpoint(obj: any): obj is Endpoint<any, any, any> {
	return (
		obj &&
		typeof obj === "object" &&
		typeof obj.method === "string" &&
		["GET", "POST", "PUT", "DELETE"].includes(obj.method.toUpperCase())
	);
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
	TBodySchema extends ZodObject | undefined,
	TSearchParamSchema extends ZodObject | undefined,
> = EndpointFunction<ApiResponse<TReturn>, TBodySchema, TSearchParamSchema> & {
	method: "GET" | "POST" | "PUT" | "DELETE";
	url?: string;
	bodySchema?: TBodySchema;
	searchParamSchema?: TSearchParamSchema;
};

export type ApiResponse<TReturn> = Omit<Response, "json"> & {
	json: () => Promise<TReturn>;
};

function fetchWrapper(
	url: string,
	method: "GET" | "POST" | "PUT" | "DELETE",
	body?: any,
	searchParams?: any,
) {
	const urlObj = new URL(url);
	if (searchParams) {
		for (const key in searchParams) {
			urlObj.searchParams.append(key, searchParams[key]);
		}
	}

	return globalThis.fetch(urlObj, {
		method,
		headers: {
			"Content-Type": "application/json",
		},
		body: body ? JSON.stringify(body) : undefined,
	});
}

function createUnfinalizedEndpoint<
	TReturn,
	TBodySchema extends ZodObject | undefined,
	TSearchParamSchema extends ZodObject | undefined,
>(
	method: "GET" | "POST" | "PUT" | "DELETE",
	bodySchema?: TBodySchema,
	searchParamSchema?: TSearchParamSchema,
): Endpoint<TReturn, TBodySchema, TSearchParamSchema> {
	const endpoint: Endpoint<TReturn, TBodySchema, TSearchParamSchema> = {
		method,
		bodySchema,
		searchParamSchema,
	} as Endpoint<TReturn, TBodySchema, TSearchParamSchema>;

	return endpoint;
}

function finalizeEndpoint<
	TReturn,
	TBodySchema extends ZodObject | undefined,
	TSearchParamSchema extends ZodObject | undefined,
>(
	endpoint: Endpoint<TReturn, TBodySchema, TSearchParamSchema>,
): Endpoint<TReturn, TBodySchema, TSearchParamSchema> {
	const endpointFunc = async (
		body: TBodySchema extends ZodObject
			? TBodySchema["_zod"]["input"]
			: undefined,
		searchParams: TSearchParamSchema extends ZodObject
			? TSearchParamSchema["_zod"]["input"]
			: undefined,
	) => {
		return fetchWrapper(
			endpoint.url || "",
			endpoint.method,
			body,
			searchParams,
		).then((res) => ({
			...res,
			json: () => res.json() as Promise<TReturn>,
		})) as Promise<ApiResponse<TReturn>>;
	};

	return Object.assign(endpointFunc, endpoint) as Endpoint<
		TReturn,
		TBodySchema,
		TSearchParamSchema
	>;
}

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
