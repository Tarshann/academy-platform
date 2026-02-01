import { nodeHTTPRequestHandler } from "@trpc/server/adapters/node-http";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

type HandlerRequest = {
  url?: string;
  query?: Record<string, string | string[] | undefined>;
};

const getTrpcPath = (req: HandlerRequest): string => {
  const queryPath = req.query?.trpc;
  if (Array.isArray(queryPath)) {
    return queryPath.join("/");
  }
  if (typeof queryPath === "string") {
    return queryPath;
  }
  const fallbackUrl = req.url ?? "";
  return fallbackUrl.replace(/^\/api\/trpc\/?/, "").split("?")[0] ?? "";
};

export default async function handler(req: any, res: any) {
  const path = getTrpcPath(req);
  await nodeHTTPRequestHandler({
    req,
    res,
    path,
    router: appRouter,
    createContext,
  });
}
