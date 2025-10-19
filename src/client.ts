// goal: api.resource(dynamicRoute).create(data)

import { ZodType } from "zod";
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

		if (item instanceof ZodType) {
			continue; // Skip Zod schemas
		}

		console.log(
			"Populating URL for:",
			key,
			baseUrl,
			isUnfilledDynamicResource(item),
		);

		if (isEndpoint(item)) {
			item.url = baseUrl;
			resource[key] = finalizeEndpoint(item);
		} else if (isUnfilledDynamicResource(item)) {
			console.log("Populating dynamic resource:", key, baseUrl);
			resource[key] = finalizeDynamicResource(item, baseUrl);
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
	[subroute: string]:
		| Resource
		| UnfilledDynamicResource<any>
		| Endpoint<any, any, any>
		| ZodType;
};

export type UnfilledDynamicResource<TResource extends Resource> = {
	[subroute: string]: TResource[string] | ZodType;
	dynamicResourceSchema: ZodType;
	(path: string): TResource;
};

function fillDynamicResource<TResource extends Resource>(
	resource: UnfilledDynamicResource<TResource>,
	dynamicPath: string,
	baseUrl: string,
): TResource {
	const filledResource: TResource = {
		...resource,
	} as unknown as TResource;

	delete filledResource.dynamic;

	populateUrls(filledResource, `${baseUrl}/${dynamicPath}`);

	return filledResource;
}

export function dynamicResource<TResource extends Resource>(
	schema: ZodType,
	resource: TResource,
): UnfilledDynamicResource<TResource> {
	return {
		...resource,
		dynamicResourceSchema: schema,
	} as unknown as UnfilledDynamicResource<TResource>;
}

function finalizeDynamicResource<TResource extends Resource>(
	resource: UnfilledDynamicResource<TResource>,
	baseUrl: string,
): Resource {
	function fill(this: UnfilledDynamicResource<TResource>, dynamicPath: string) {
		return fillDynamicResource(
			resource as UnfilledDynamicResource<TResource>,
			dynamicPath,
			baseUrl,
		);
	}

	const dynamicResource = {
		...resource,
	} as UnfilledDynamicResource<TResource>;

	const dynamicResourceWithFunction = fill.bind(dynamicResource);

	Object.assign(dynamicResourceWithFunction, dynamicResource);

	return dynamicResourceWithFunction as unknown as UnfilledDynamicResource<TResource>;
}

function isUnfilledDynamicResource(
	obj: any,
): obj is UnfilledDynamicResource<any> {
	return obj.dynamicResourceSchema instanceof ZodType;
}
