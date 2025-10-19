import z from "zod";
import { ApiClient, ApiSchema } from "./src/client";
import { GET, POST } from "./src/helpers";

const apiSchema = {
	user: {
		profile: {
			get: GET<{ name: string }>(),
			post: POST<{ name: string }, z.ZodObject<{ id: z.ZodString }>, undefined>(
				{
					bodySchema: z.object({ id: z.string() }),
				},
			),
		},
	},
} satisfies ApiSchema;

const api = new ApiClient<typeof apiSchema>(
	apiSchema,
	"http://example.com/api",
);

console.log(api.user.profile.get.url);

const res = api.user.profile.post({ id: "123" }, undefined);
res.then(async (response) => {
	response.json().then((data) => {
		data.name;
	});
});

const schema = apiSchema.user.profile.post.bodySchema;
