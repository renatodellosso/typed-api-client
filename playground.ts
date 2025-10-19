import z from "zod";
import { ApiClient, ApiSchema, GET, POST } from "./src";

const apiSchema = {
	user: {
		profile: {
			post: POST<{ name: string }, z.ZodObject<{ id: z.ZodString }>>(
				z.object({ id: z.string() }),
			),
		},
	},
} satisfies ApiSchema;

const api = new ApiClient<typeof apiSchema>(
	apiSchema,
	"http://example.com/api",
);

const res = api.user.profile.post({ id: "123" });
res.then(async (response) => {
	response.json().then((data) => {
		data.name;
	});
});

api.user.profile.post.schema;
