import z from "zod";
import { ApiClient, ApiSchema, POST } from "./src";

const apiSchema = {
	user: {
		profile: {
			post: POST<{ name: string }, z.ZodObject<{ id: z.ZodString }>, undefined>(
				z.object({ id: z.string() }),
				undefined,
			),
		},
	},
} satisfies ApiSchema;

const api = new ApiClient<typeof apiSchema>(
	apiSchema,
	"http://example.com/api",
);

const res = api.user.profile.post({ id: "123" }, undefined);
res.then(async (response) => {
	response.json().then((data) => {
		data.name;
	});
});
