import z from "zod";
import { ApiClient, ApiSchema, GET, POST } from "../src";

describe("ApiClient", () => {
	it("populates URLs", async () => {
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

		expect(api.user.profile.post.url).toBe(
			"http://example.com/api/user/profile/post",
		);
	});

	it("allows requests", async () => {
		// Mock fetch globally
		global.fetch = jest.fn(() =>
			Promise.resolve({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ name: "John Doe" }),
			} as Response),
		) as jest.Mock;

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

		const res = await api.user.profile.post({ id: "123" });
		const data = await res.json();

		expect(global.fetch).toHaveBeenCalledWith(
			"http://example.com/api",
			expect.objectContaining({
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ id: "123" }),
			}),
		);
		expect(res.status).toBe(200);
		expect(data.name).toBe("John Doe");
	});
});
