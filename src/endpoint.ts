import { StandardSchemaV1 } from "@standard-schema/spec";

export enum HttpMethod {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	DELETE = "DELETE",
	PATCH = "PATCH",
}

export function isEndpoint(obj: any): obj is Endpoint<any, any, any> {
	return (
		obj &&
		typeof obj === "object" &&
		typeof obj.method === "string" &&
		Object.values(HttpMethod).includes(obj.method.toUpperCase())
	);
}

type Input<T> =
	T extends StandardSchemaV1<object>
		? StandardSchemaV1.InferInput<T>
		: undefined;

interface EndpointFunction<
	TReturn,
	TBodySchema extends StandardSchemaV1<object> | undefined,
	TSearchParamSchema extends StandardSchemaV1<object> | undefined,
> {
	(
		...args: TBodySchema extends StandardSchemaV1<object>
			? TSearchParamSchema extends StandardSchemaV1<object>
				? [body: Input<TBodySchema>, searchParams: Input<TSearchParamSchema>]
				: [body: Input<TBodySchema>]
			: TSearchParamSchema extends StandardSchemaV1<object>
				? [searchParams: Input<TSearchParamSchema>]
				: []
	): Promise<TReturn>;
}

export type Endpoint<
	TReturn,
	TBodySchema extends StandardSchemaV1<object> | undefined,
	TSearchParamSchema extends StandardSchemaV1<object> | undefined,
> = EndpointFunction<ApiResponse<TReturn>, TBodySchema, TSearchParamSchema> & {
	method: HttpMethod;
	url?: string;
	bodySchema?: TBodySchema;
	searchParamSchema?: TSearchParamSchema;
};

export type ApiResponse<TReturn> = Omit<Response, "json"> & {
	json: () => Promise<TReturn>;
};

function fetchWrapper(
	url: string,
	method: HttpMethod,
	body?: any,
	searchParams?: any,
) {
	const urlObj = new URL(url);
	if (searchParams) {
		for (const key in searchParams) {
			urlObj.searchParams.append(key, searchParams[key]);
		}
	}

	console.log("Fetching URL:", urlObj.toString(), "Body:", body);

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
	TBodySchema extends StandardSchemaV1<object> | undefined,
	TSearchParamSchema extends StandardSchemaV1<object> | undefined,
>(
	method: HttpMethod,
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
	TBodySchema extends StandardSchemaV1<object> | undefined,
	TSearchParamSchema extends StandardSchemaV1<object> | undefined,
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
