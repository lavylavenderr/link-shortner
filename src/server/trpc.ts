import { TRPCError, initTRPC } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { prisma } from "@/lib/db";
import { ZodError } from "zod";

export const createContext = async (opts: CreateNextContextOptions) => {
  const req = opts.req;
  const cookies = req.cookies;

  const user = await prisma.session.findUnique({
    where: {
      // @ts-expect-error
      key: cookies.get("foxauth").value ?? "",
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
  });

  return {
    user: user,
  };
};
export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  errorFormatter(opts) {
    const { shape, error } = opts;
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});
export const router = t.router;
export const mergeRouters = t;

export const publicProcedure = t.procedure;
export const authProcedure = t.procedure.use(async (opts) => {
  if (!opts.ctx.user)
    throw new TRPCError({
      message: "Unauthorized",
      code: "UNAUTHORIZED",
    });

  return opts.next({
    ctx: {
      user: opts.ctx.user,
    },
  });
});
