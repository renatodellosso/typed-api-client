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
	[subroute: string]: Resource | Endpoint<any, any>;
};

interface EndpointFunction<TReturn, TSchema extends ZodObject | undefined> {
	(
		data: TSchema extends ZodObject ? TSchema["_zod"]["input"] : unknown,
	): Promise<TReturn>;
}

export type Endpoint<
	TReturn,
	TSchema extends ZodObject | undefined,
> = EndpointFunction<ApiResponse<TReturn>, TSchema> & {
	url?: string;
	schema: TSchema;
};

export type ApiResponse<TReturn> = Omit<Response, "json"> & {
	json: () => Promise<TReturn>;
};

function endpointMethod<TReturn, TSchema extends ZodObject | undefined>(
	schema: TSchema,
	method: "GET" | "POST" | "PUT" | "DELETE",
): Endpoint<TReturn, TSchema> {
	const endpoint = async (
		data: TSchema extends ZodObject ? TSchema["_zod"]["input"] : unknown,
	) => {
		const parsedData = schema?.parse(data);
		return fetch("http://example.com/api", {
			method,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(parsedData),
		}).then((res) => ({
			...res,
			json: () => res.json() as Promise<TReturn>,
		})) as Promise<ApiResponse<TReturn>>;
	};

	return Object.assign(endpoint, { schema });
}

export function GET<TReturn>(): Endpoint<TReturn, undefined> {
	return endpointMethod<TReturn, undefined>(undefined, "GET");
}

export function POST<TReturn, TSchema extends ZodObject>(
	schema: TSchema,
): Endpoint<TReturn, TSchema> {
	return endpointMethod<TReturn, TSchema>(schema, "POST");
}

export function PUT<TReturn, TSchema extends ZodObject>(
	schema: TSchema,
): Endpoint<TReturn, TSchema> {
	return endpointMethod<TReturn, TSchema>(schema, "PUT");
}

export function DELETE<TReturn, TSchema extends ZodObject>(
	schema: TSchema,
): Endpoint<TReturn, TSchema> {
	return endpointMethod<TReturn, TSchema>(schema, "DELETE");
}
