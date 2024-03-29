import { prisma } from "@/lib/db";
import { authProcedure, router } from "../trpc";
import * as z from "zod";
import { customAlphabet } from "nanoid";
import { TRPCError } from "@trpc/server";

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const getHash = customAlphabet(characters, 5);

async function checkIfExisting(hash: string) {
  const existingCheck = await prisma.link.findUnique({
    where: {
      uid: hash,
    },
  });

  return existingCheck;
}

export const links = router({
  getAllLinks: authProcedure.query(async ({ ctx, input }) => {
    const user = await prisma.user.findUnique({
      where: {
        username: ctx.user.user.username,
      },
    });
    if (!user)
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not logged in",
      });

    const links = await prisma.link.findMany();

    return links;
  }),
  deleteLink: authProcedure
    .input(z.object({ linkId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: {
          username: ctx.user.user.username,
        },
      });
      if (!user)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not logged in",
        });

      const link = await prisma.link.findUnique({
        where: {
          id: input.linkId,
        },
      });
      if (!link)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Link not found",
        });

      await prisma.link.delete({
        where: { id: input.linkId },
      });

      return {
        message: "OK",
      };
    }),
  createLink: authProcedure
    .input(z.object({ newURL: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: {
          username: ctx.user.user.username,
        },
      });
      if (!user)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not logged in",
        });

      let hash = getHash();
      while (await checkIfExisting(hash)) {
        hash = getHash();
      }

      await prisma.link.create({
        data: {
          uid: hash,
          link: input.newURL,
          shortUrl: `${process.env.BASE_URL}/${hash}`,
        },
      });

      return {
        message: "OK",
        data: {
          shortUrl: `${process.env.BASE_URL}/${hash}`,
          uid: hash,
          newURL: input.newURL,
        },
      };
    }),
});
