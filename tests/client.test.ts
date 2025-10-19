import z from "zod";
import { initApiClient, ApiSchema, dynamicResource } from "../src/client";
import { GET, POST, PUT } from "../src/helpers";

describe("ApiClient", () => {
	it("populates URLs", async () => {
		const api = {
			user: {
				profile: {
					post: POST<{ name: string }, z.ZodObject<{ id: z.ZodString }>>({
						bodySchema: z.object({ id: z.string() }),
					}),
				},
			},
		} satisfies ApiSchema;

		initApiClient(api, "http://example.com/api");

		expect(api.user.profile.post.url).toBe(
			"http://example.com/api/user/profile",
		);
	});

	it("allows requests with body", async () => {
		// Mock fetch globally
		global.fetch = jest.fn(() =>
			Promise.resolve({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ name: "John Doe" }),
			} as Response),
		) as jest.Mock;

		const api = {
			user: {
				profile: {
					post: POST<{ name: string }, z.ZodObject<{ id: z.ZodString }>>({
						bodySchema: z.object({ id: z.string() }),
					}),
				},
			},
		} satisfies ApiSchema;

		initApiClient(api, "http://example.com/api");

		const res = await api.user.profile.post({ id: "123" });
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

	it("allows GET requests with search params", async () => {
		// Mock fetch globally
		global.fetch = jest.fn(() =>
			Promise.resolve({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ name: "Jane Doe" }),
			} as Response),
		) as jest.Mock;

		const api = {
			user: {
				profile: {
					get: GET<{ name: string }, z.ZodObject<{ userId: z.ZodString }>>({
						searchParamSchema: z.object({ userId: z.string() }),
					}),
				},
			},
		} satisfies ApiSchema;

		initApiClient(api, "http://example.com/api");

		const res = await api.user.profile.get({
			userId: "456",
		});
		const data = await res.json();

		const call = (global.fetch as jest.Mock).mock.calls[0];
		const fetchedUrl = (call[0] as URL).href;
		expect(fetchedUrl).toBe("http://example.com/api/user/profile?userId=456");

		expect(res.status).toBe(200);
		expect(data.name).toBe("Jane Doe");
	});

	it("allows requests with both body and search params", async () => {
		// Mock fetch globally
		global.fetch = jest.fn(() =>
			Promise.resolve({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ success: true }),
			} as Response),
		) as jest.Mock;

		const api = {
			user: {
				profile: {
					put: PUT<
						{ success: boolean },
						z.ZodObject<{ name: z.ZodString }>,
						z.ZodObject<{ notify: z.ZodBoolean }>
					>({
						bodySchema: z.object({ name: z.string() }),
						searchParamSchema: z.object({ notify: z.boolean() }),
					}),
				},
			},
		} satisfies ApiSchema;

		initApiClient(api, "http://example.com/api");

		const res = await api.user.profile.put({ name: "Alice" }, { notify: true });
		const data = await res.json();

		const call = (global.fetch as jest.Mock).mock.calls[0];
		const fetchedUrl = (call[0] as URL).href;
		const fetchOptions = call[1];

		expect(fetchedUrl).toBe("http://example.com/api/user/profile?notify=true");
		expect(fetchOptions.method).toBe("PUT");
		expect(fetchOptions.body).toBe(JSON.stringify({ name: "Alice" }));

		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
	});
});

describe("Dynamic Resource Filling", () => {
	it("fills dynamic resource paths correctly", async () => {
		// Mock fetch globally
		global.fetch = jest.fn(() =>
			Promise.resolve({
				ok: true,
				status: 200,
				json: () =>
					Promise.resolve({ comments: ["Great post!", "Thanks for sharing."] }),
			} as Response),
		) as jest.Mock;

		const api = {
			posts: {
				postId: dynamicResource(z.string()).with({
					comments: {
						get: GET<{ comments: string[] }>(),
					},
				}),
			},
		} satisfies ApiSchema;

		initApiClient(api, "http://example.com/api");

		const filledResource = api.posts.postId("789");
		filledResource.comments.get;

		expect(filledResource.comments.get.url).toBe(
			"http://example.com/api/posts/789/comments",
		);

		const res = await filledResource.comments.get();
		const data = await res.json();

		const call = (global.fetch as jest.Mock).mock.calls[0];
		const fetchedUrl = (call[0] as URL).href;

		expect(fetchedUrl).toBe("http://example.com/api/posts/789/comments");

		expect(res.status).toBe(200);
		expect(data.comments).toBeDefined();
	});
});
