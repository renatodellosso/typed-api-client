import z from "zod";
import { ApiSchema, dynamicRoute, initApiClient } from "./src/client";
import { GET, POST } from "./src/helpers";

const api = {
	user: {
		profile: {
			get: GET<{ name: string }, z.ZodString>({
				searchParamSchema: z.string(),
			}),
			post: POST<{ name: string }, z.ZodObject<{ id: z.ZodString }>>({
				bodySchema: z.object({ id: z.string() }),
			}),
			id: dynamicRoute(z.number()).with({
				comments: {
					get: GET<{ comments: string[] }>(),
				},
			}),
		},
	},
} satisfies ApiSchema;

initApiClient(api, "http://example.com/api");

api.user.profile.get("");

console.log(api.user.profile.get.url);

const res = api.user.profile.post({ id: "123" });
res.then(async (response) => {
	response.json().then((data) => {
		data.name;
	});
});

const schema = api.user.profile.post.bodySchema;

api.user.profile.id(123).comments.get;

const api2 = {
	serverState: {
		get: GET<number>(),
	},
	containers: dynamicRoute(z.string()).with({
		status: {
			get: GET<number>(),
		},
	}),
} satisfies ApiSchema;
