// goal: api.route(dynamicRoute).create(data)

import { ZodType } from "zod";
import { finalizeEndpoint, Endpoint, isEndpoint } from "./endpoint";

export function initApiClient<TSchema extends ApiSchema>(
	schema: TSchema,
	baseUrl: string,
) {
	populateUrls(schema, baseUrl);
}

function populateUrls(route: any, baseUrl: string) {
	for (const key in route) {
		const item = route[key];

		if (item instanceof ZodType) {
			continue; // Skip Zod schemas
		}

		console.log(
			"Populating URL for:",
			key,
			baseUrl,
			isUnfilledDynamicRoute(item),
		);

		if (isEndpoint(item)) {
			item.url = baseUrl;
			route[key] = finalizeEndpoint(item);
		} else if (isUnfilledDynamicRoute(item)) {
			console.log("Populating dynamic route:", key, baseUrl);
			route[key] = finalizeDynamicRoute(item, baseUrl);
		} else if (typeof item === "object" && item !== null) {
			populateUrls(item, `${baseUrl}/${key}`);
		} else {
			throw new Error(`Invalid schema item at ${baseUrl}/${key}`);
		}
	}
}

export interface ApiSchema {
	[route: string]: Route;
}

export type Route = {
	[subroute: string]:
		| Route
		| UnfilledDynamicRoute<any, any>
		| Endpoint<any, any, any>
		| ZodType;
};

export type UnfilledDynamicRoute<
	TRoute extends Route,
	TSchema extends ZodType,
> = {
	[subroute: string]: TRoute[string] | TSchema;
	dynamicRouteSchema: TSchema;
	(path: TSchema["_zod"]["input"]): TRoute;
};

function fillDynamicRoute<
	TRoute extends Route,
	TSchema extends ZodType,
>(
	route: UnfilledDynamicRoute<TRoute, TSchema>,
	dynamicPath: TSchema["_zod"]["input"],
	baseUrl: string,
): TRoute {
	const filledRoute: TRoute = {
		...route,
	} as unknown as TRoute;

	populateUrls(filledRoute, `${baseUrl}/${dynamicPath}`);

	return filledRoute;
}

export class PartialDynamicRoute<TSchema extends ZodType> {
	constructor(private readonly schema: TSchema) {}

	with<TRoute extends Route>(
		route: TRoute,
	): UnfilledDynamicRoute<TRoute, TSchema> {
		return {
			...route,
			dynamicRouteSchema: this.schema,
		} as unknown as UnfilledDynamicRoute<TRoute, TSchema>;
	}
}

export function dynamicRoute<TSchema extends ZodType>(schema: TSchema) {
	return new PartialDynamicRoute<TSchema>(schema);
}

function finalizeDynamicRoute<
	TRoute extends Route,
	TSchema extends ZodType,
>(
	route: UnfilledDynamicRoute<TRoute, TSchema>,
	baseUrl: string,
): Route {
	function fill(
		this: UnfilledDynamicRoute<TRoute, TSchema>,
		dynamicPath: TSchema["_zod"]["input"],
	) {
		return fillDynamicRoute(
			route as UnfilledDynamicRoute<TRoute, TSchema>,
			dynamicPath,
			baseUrl,
		);
	}

	const dynamicRoute = {
		...route,
	} as UnfilledDynamicRoute<TRoute, TSchema>;

	const dynamicRouteWithFunction = fill.bind(dynamicRoute);

	Object.assign(dynamicRouteWithFunction, dynamicRoute);

	return dynamicRouteWithFunction as unknown as UnfilledDynamicRoute<
		TRoute,
		TSchema
	>;
}

function isUnfilledDynamicRoute(
	obj: any,
): obj is UnfilledDynamicRoute<any, any> {
	return obj.dynamicRouteSchema instanceof ZodType;
}
