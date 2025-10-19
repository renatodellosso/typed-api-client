import z from "zod";
import { ApiClient, ApiSchema, dynamicResource } from "./src/client";
import { GET, POST } from "./src/helpers";

const apiSchema = {
	user: {
		profile: {
			get: GET<{ name: string }, z.ZodString>({
				searchParamSchema: z.string(),
			}),
			post: POST<{ name: string }, z.ZodObject<{ id: z.ZodString }>>({
				bodySchema: z.object({ id: z.string() }),
			}),
			id: dynamicResource(z.number()).with({
				comments: {
					get: GET<{ comments: string[] }>(),
				},
			}),
		},
	},
} satisfies ApiSchema;

const api = new ApiClient<typeof apiSchema>(
	apiSchema,
	"http://example.com/api",
);

console.log(api.user.profile.get.url);

const res = api.user.profile.post({ id: "123" });
res.then(async (response) => {
	response.json().then((data) => {
		data.name;
	});
});

const schema = apiSchema.user.profile.post.bodySchema;

api.user.profile.id(123);
