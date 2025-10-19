// goal: api.resource(dynamicRoute).create(data)

import { finalizeEndpoint, Endpoint, isEndpoint } from "./endpoint";

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
