import { ZodObject } from "zod";

export function isEndpoint(obj: any): obj is Endpoint<any, any, any> {
	return (
		obj &&
		typeof obj === "object" &&
		typeof obj.method === "string" &&
		["GET", "POST", "PUT", "DELETE"].includes(obj.method.toUpperCase())
	);
}

type ZodToType<T> = T extends ZodObject ? T["_zod"]["input"] : undefined;

interface EndpointFunction<
	TReturn,
	TBodySchema extends ZodObject | undefined,
	TSearchParamSchema extends ZodObject | undefined,
> {
	(
		// body: TBodySchema extends ZodObject
		// 	? TBodySchema["_zod"]["input"]
		// 	: undefined,
		// searchParams: TSearchParamSchema extends ZodObject
		// 	? TSearchParamSchema["_zod"]["input"]
		// 	: undefined,
		...args: TBodySchema extends ZodObject
			? TSearchParamSchema extends ZodObject
				? [
						body: ZodToType<TBodySchema>,
						searchParams: ZodToType<TSearchParamSchema>,
					]
				: [body: ZodToType<TBodySchema>]
			: TSearchParamSchema extends ZodObject
				? [searchParams: ZodToType<TSearchParamSchema>]
				: []
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

export function createUnfinalizedEndpoint<
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

export function finalizeEndpoint<
	TReturn,
	TBodySchema extends ZodObject | undefined,
	TSearchParamSchema extends ZodObject | undefined,
>(
	endpoint: Endpoint<TReturn, TBodySchema, TSearchParamSchema>,
): Endpoint<TReturn, TBodySchema, TSearchParamSchema> {
	const endpointFunc = async (
		body: ZodToType<TBodySchema>,
		searchParams: ZodToType<TSearchParamSchema>,
	) => {
		if (!endpoint.bodySchema && endpoint.searchParamSchema) {
			// Adjust parameters if only searchParams is defined
			searchParams = body as unknown as ZodToType<TSearchParamSchema>;
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
