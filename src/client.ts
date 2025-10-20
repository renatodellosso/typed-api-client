import { ZodType } from "zod";
import { finalizeEndpoint, Endpoint, isEndpoint } from "./endpoint";
import { StandardSchemaV1 } from "@standard-schema/spec";

export function initApiClient<TSchema extends ApiSchema>(
	schema: TSchema,
	baseUrl: string,
) {
	populateUrls(schema, baseUrl);
}

function populateUrls(route: any, baseUrl: string) {
	for (const key in route) {
		const item = route[key];

		if (isValidator(item)) {
			continue; // Skip Zod schemas
		}

		if (isEndpoint(item)) {
			item.url = baseUrl;
			route[key] = finalizeEndpoint(item);
		} else if (isUnfilledDynamicRoute(item)) {
			route[key] = finalizeDynamicRoute(item, baseUrl);
		} else if (typeof item === "object" && item !== null) {
			populateUrls(item, `${baseUrl}/${key}`);
		} else {
			throw new Error(`Invalid schema item at ${baseUrl}/${key}`);
		}
	}
}

function isValidator(obj: any): obj is StandardSchemaV1 {
	return obj != undefined && "~standard" in obj;
}

export interface ApiSchema {
	[route: string]: Route | UnfilledDynamicRoute<any, any>;
}

export type Route = {
	[subroute: string]:
		| Route
		| UnfilledDynamicRoute<any, any>
		| Endpoint<any, any, any>
		| StandardSchemaV1;
};

export type UnfilledDynamicRoute<
	TRoute extends Route,
	TSchema extends StandardSchemaV1,
> = {
	[subroute: string]: TRoute[string] | TSchema;
	dynamicRouteSchema: TSchema;
	(path: StandardSchemaV1.InferInput<TSchema>): TRoute;
};

function fillDynamicRoute<
	TRoute extends Route,
	TSchema extends StandardSchemaV1,
>(
	route: UnfilledDynamicRoute<TRoute, TSchema>,
	dynamicPath: StandardSchemaV1.InferInput<TSchema>,
	baseUrl: string,
): TRoute {
	const filledRoute: TRoute = {
		...route,
	} as unknown as TRoute;

	populateUrls(filledRoute, `${baseUrl}/${dynamicPath}`);

	return filledRoute;
}

export class PartialDynamicRoute<TSchema extends StandardSchemaV1> {
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

export function dynamicRoute<TSchema extends StandardSchemaV1>(
	schema: TSchema,
) {
	return new PartialDynamicRoute<TSchema>(schema);
}

function finalizeDynamicRoute<
	TRoute extends Route,
	TSchema extends StandardSchemaV1,
>(route: UnfilledDynamicRoute<TRoute, TSchema>, baseUrl: string): Route {
	function fill(
		this: UnfilledDynamicRoute<TRoute, TSchema>,
		dynamicPath: StandardSchemaV1.InferInput<TSchema>,
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
	return isValidator(obj.dynamicRouteSchema);
}
