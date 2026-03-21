import { db } from "../index";

async function main() {
  const user = await db.user.upsert({
    where: { email: "demo@liberation.local" },
    update: {},
    create: {
      email: "demo@liberation.local",
      name: "Demo User",
      workspaces: {
        create: {
          name: "Liberation Lab",
          niche: "AI business systems",
          brandVoice: "sharp, modern, execution-first",
        },
      },
    },
    include: { workspaces: true },
  });

  console.log("Seeded demo workspace:", user.workspaces[0]?.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
