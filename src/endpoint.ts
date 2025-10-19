import { StandardSchemaV1 } from "@standard-schema/spec";

export function isEndpoint(obj: any): obj is Endpoint<any, any, any> {
	return (
		obj &&
		typeof obj === "object" &&
		typeof obj.method === "string" &&
		["GET", "POST", "PUT", "DELETE"].includes(obj.method.toUpperCase())
	);
}

type Input<T> = T extends StandardSchemaV1
	? StandardSchemaV1.InferInput<T>
	: undefined;

interface EndpointFunction<
	TReturn,
	TBodySchema extends StandardSchemaV1 | undefined,
	TSearchParamSchema extends StandardSchemaV1 | undefined,
> {
	(
		...args: TBodySchema extends StandardSchemaV1
			? TSearchParamSchema extends StandardSchemaV1
				? [body: Input<TBodySchema>, searchParams: Input<TSearchParamSchema>]
				: [body: Input<TBodySchema>]
			: TSearchParamSchema extends StandardSchemaV1
				? [searchParams: Input<TSearchParamSchema>]
				: []
	): Promise<TReturn>;
}

export type Endpoint<
	TReturn,
	TBodySchema extends StandardSchemaV1 | undefined,
	TSearchParamSchema extends StandardSchemaV1 | undefined,
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

export function createUnfinalizedEndpoint<
	TReturn,
	TBodySchema extends StandardSchemaV1 | undefined,
	TSearchParamSchema extends StandardSchemaV1 | undefined,
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

export function finalizeEndpoint<
	TReturn,
	TBodySchema extends StandardSchemaV1 | undefined,
	TSearchParamSchema extends StandardSchemaV1 | undefined,
>(
	endpoint: Endpoint<TReturn, TBodySchema, TSearchParamSchema>,
): Endpoint<TReturn, TBodySchema, TSearchParamSchema> {
	const endpointFunc = async (
		body: Input<TBodySchema>,
		searchParams: Input<TSearchParamSchema>,
	) => {
		if (!endpoint.bodySchema && endpoint.searchParamSchema) {
			// Adjust parameters if only searchParams is defined
			searchParams = body as unknown as Input<TSearchParamSchema>;
		}

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
