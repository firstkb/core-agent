type ApiHealth = {
  status: "ok" | "degraded";
  checkedAt: string;
};

type ApiClient = {
  getHealth: () => Promise<ApiHealth>;
};

function createApiClient(baseUrl: string): ApiClient {
  return {
    async getHealth() {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/health`);

      if (!response.ok) {
        return {
          status: "degraded",
          checkedAt: new Date().toISOString(),
        };
      }

      return {
        status: "ok",
        checkedAt: new Date().toISOString(),
      };
    },
  };
}

export { createApiClient };
export type { ApiClient, ApiHealth };
