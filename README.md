# Typed API Client

This package allows you to create a strongly-typed client for your API in TypeScript.

## Getting Started

### Installation

You can install the package via npm:

```bash
npm install @renatodellosso/typed-api-client
```

### Usage

First, create an API schema that defines your endpoints and their types:

```typescript
import {
	ApiSchema,
	dynamicRoute,
	initApiClient,
} from "@renatodellosso/typed-api-client/client";
import { GET, POST } from "@renatodellosso/typed-api-client/helpers";
import z from "zod";

const api = {
	user: {
		profile: {
			get: GET<{ name: string }, z.ZodString>({
				searchParamSchema: z.string(),
			}),
			post: POST<{ name: string }, z.ZodObject<{ id: z.ZodString }>>({
				bodySchema: z.object({ id: z.string() }),
			}),
		},
	},
} satisfies ApiSchema;
```

Be sure to use `satisfies ApiSchema` instead of `: ApiSchema` to preserve type information about your routes.

Also note that this package is compliant with [Standard Schema](https://standardschema.dev/) - you can use any schema validator library that works with it (such as Zod).

Then, initialize the API client with your base URL and schema:

```typescript
initApiClient(api, "https://api.example.com");
```

Now you can use the generated client to make requests with full type safety:

```typescript
const userProfile = await api.user.profile.get("john_doe");
console.log(userProfile.name); // TypeScript knows this is a string
const newUser = await api.user.profile.post({ id: "12345" });
console.log(newUser.id); // TypeScript knows this is a string
```

Dynamic routes are also supported:

```typescript
const api = {
	user: {
		profile: {
			id: dynamicRoute(z.number()).with({
				comments: {
					get: GET<{ comments: string[] }>(),
				},
			}),
		},
	},
} satisfies ApiSchema;

initApiClient(api, "https://api.example.com");

const userComments = await api.user.profile.id(42).comments.get();
```

This will create a route like `/user/profile/42/comments` where `42` is a dynamic segment. The type of the dynamic segment is enforced by the schema provided to `dynamicRoute`.
