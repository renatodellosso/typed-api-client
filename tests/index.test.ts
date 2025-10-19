import z from "zod";
import { ApiClient, ApiSchema } from "../src/client";
import { GET, POST } from "../src/helpers";

describe("ApiClient", () => {
	it("populates URLs", async () => {
		const apiSchema = {
			user: {
				profile: {
					post: POST<{ name: string }, z.ZodObject<{ id: z.ZodString }>>({
						bodySchema: z.object({ id: z.string() }),
					}),
				},
			},
		} satisfies ApiSchema;

		const api = new ApiClient<typeof apiSchema>(
			apiSchema,
			"http://example.com/api",
		);

		expect(api.user.profile.post.url).toBe(
			"http://example.com/api/user/profile",
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
					post: POST<{ name: string }, z.ZodObject<{ id: z.ZodString }>>({
						bodySchema: z.object({ id: z.string() }),
					}),
				},
			},
		} satisfies ApiSchema;

		const api = new ApiClient<typeof apiSchema>(
			apiSchema,
			"http://example.com/api",
		);

		const res = await api.user.profile.post({ id: "123" }, undefined);
		const data = await res.json();

		const call = (global.fetch as jest.Mock).mock.calls[0];
		const fetchedUrl = (call[0] as URL).href;
		const fetchOptions = call[1];

		expect(fetchedUrl).toBe("http://example.com/api/user/profile");
		expect(fetchOptions.method).toBe("POST");
		expect(fetchOptions.body).toBe(JSON.stringify({ id: "123" }));

		expect(res.status).toBe(200);
		expect(data.name).toBe("John Doe");
	});

	it("allows GET requests with params", async () => {
		// Mock fetch globally
		global.fetch = jest.fn(() =>
			Promise.resolve({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ name: "Jane Doe" }),
			} as Response),
		) as jest.Mock;

		const apiSchema = {
			user: {
				profile: {
					get: GET<{ name: string }, z.ZodObject<{ userId: z.ZodString }>>({
						searchParamSchema: z.object({ userId: z.string() }),
					}),
				},
			},
		} satisfies ApiSchema;

		const api = new ApiClient<typeof apiSchema>(
			apiSchema,
			"http://example.com/api",
		);

		const res = await api.user.profile.get(undefined, {
			userId: "456",
		});
		const data = await res.json();

		const call = (global.fetch as jest.Mock).mock.calls[0];
		const fetchedUrl = (call[0] as URL).href;
		expect(fetchedUrl).toBe("http://example.com/api/user/profile?userId=456");

		expect(res.status).toBe(200);
		expect(data.name).toBe("Jane Doe");
	});
});
