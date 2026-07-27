import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const passwordHash = await bcrypt.hash("together123", 10);

  const trevor = await prisma.profile.upsert({
    where: { email: "trevor@together.app" },
    update: { fullName: "Trevor", passwordHash },
    create: {
      email: "trevor@together.app",
      fullName: "Trevor",
      passwordHash,
    },
  });

  const chanda = await prisma.profile.upsert({
    where: { email: "chanda@together.app" },
    update: { fullName: "Chanda", passwordHash },
    create: {
      email: "chanda@together.app",
      fullName: "Chanda",
      passwordHash,
    },
  });

  let membership = await prisma.householdMember.findFirst({
    where: { userId: trevor.id, status: "active" },
    include: { household: true },
  });

  let household = membership?.household;
  if (!household) {
    household = await prisma.household.create({
      data: {
        name: "Trevor & Chanda",
        createdBy: trevor.id,
        members: {
          create: [
            {
              userId: trevor.id,
              role: "creator",
              status: "active",
              joinedAt: new Date(),
            },
            {
              userId: chanda.id,
              role: "partner",
              status: "active",
              joinedAt: new Date(),
            },
          ],
        },
      },
    });
  } else {
    await prisma.householdMember.upsert({
      where: {
        householdId_userId: { householdId: household.id, userId: chanda.id },
      },
      update: { status: "active", role: "partner" },
      create: {
        householdId: household.id,
        userId: chanda.id,
        role: "partner",
        status: "active",
        joinedAt: new Date(),
      },
    });
    await prisma.household.update({
      where: { id: household.id },
      data: { name: "Trevor & Chanda" },
    });
  }

  await prisma.notificationPreference.upsert({
    where: { userId: trevor.id },
    update: {},
    create: { userId: trevor.id },
  });
  await prisma.notificationPreference.upsert({
    where: { userId: chanda.id },
    update: {},
    create: { userId: chanda.id },
  });

  const existingItems = await prisma.item.count({ where: { householdId: household.id } });
  if (existingItems === 0) {
    const grocery = await prisma.item.create({
      data: {
        householdId: household.id,
        type: "task",
        title: "Grocery shop for the week",
        description: "Stock up on produce, snacks, and dinner staples.",
        status: "not_started",
        createdBy: trevor.id,
        ownerId: chanda.id,
        priority: "normal",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.item.create({
      data: {
        householdId: household.id,
        type: "task",
        title: "Book dentist appointments",
        description: "Schedule cleanings for both of us.",
        status: "in_progress",
        createdBy: chanda.id,
        ownerId: trevor.id,
        priority: "high",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.item.create({
      data: {
        householdId: household.id,
        type: "task",
        title: "Pay electric bill",
        status: "completed",
        createdBy: trevor.id,
        ownerId: trevor.id,
        completedAt: new Date(),
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });

    const decision = await prisma.item.create({
      data: {
        householdId: household.id,
        type: "decision",
        title: "Summer vacation location",
        description:
          "Where should we go for our summer vacation this year? Let's choose a place we'll both love.",
        status: "awaiting_response",
        createdBy: trevor.id,
        priority: "high",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const lake = await prisma.decisionOption.create({
      data: {
        itemId: decision.id,
        title: "Lake cabin",
        pros: ["Peaceful", "Scenery", "Unplugging"],
        cons: ["Long drive", "Limited activities", "Spotty cell service"],
        sortOrder: 0,
      },
    });
    const beach = await prisma.decisionOption.create({
      data: {
        itemId: decision.id,
        title: "Beach trip",
        pros: ["Warm", "Great food", "Lots to explore"],
        cons: ["More expensive", "Crowds", "Travel time"],
        sortOrder: 1,
      },
    });
    await prisma.decisionOption.create({
      data: {
        itemId: decision.id,
        title: "Staycation",
        pros: ["Budget-friendly", "No travel stress", "Time for projects"],
        cons: ["Not a big change", "Easy to fill with chores", "Less adventure"],
        sortOrder: 2,
      },
    });

    await prisma.decisionResponse.create({
      data: {
        itemId: decision.id,
        optionId: beach.id,
        userId: trevor.id,
        note: "I'm leaning beach this year.",
      },
    });

    const goal = await prisma.item.create({
      data: {
        householdId: household.id,
        type: "goal",
        title: "Weekly date night",
        description: "Protect one evening a week just for us.",
        status: "on_track",
        createdBy: chanda.id,
        dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.goalDetails.create({
      data: {
        itemId: goal.id,
        trackingType: "habit",
        targetValue: 12,
        currentValue: 7,
        unit: "weeks",
        weeklyFrequency: 1,
        streakCount: 3,
      },
    });

    const finance = await prisma.item.create({
      data: {
        householdId: household.id,
        type: "financial_target",
        title: "Emergency fund",
        description: "Peace of mind for life's unexpected moments.",
        status: "on_track",
        createdBy: trevor.id,
        dueDate: new Date("2025-12-31"),
      },
    });
    await prisma.financialDetails.create({
      data: {
        itemId: finance.id,
        targetAmountCents: 1_200_000,
        currentAmountCents: 840_000,
      },
    });
    await prisma.financialContribution.createMany({
      data: [
        {
          itemId: finance.id,
          amountCents: 50_000,
          contributorId: trevor.id,
          contributedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          note: "May transfer",
        },
        {
          itemId: finance.id,
          amountCents: 30_000,
          contributorId: chanda.id,
          contributedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    await prisma.comment.createMany({
      data: [
        {
          itemId: decision.id,
          userId: trevor.id,
          body: "I've been thinking about a beach trip. Warm weather, good food, and lots to explore!",
        },
        {
          itemId: goal.id,
          userId: chanda.id,
          body: "Last week's Italian night was perfect. Let's keep the streak going!",
        },
        {
          itemId: finance.id,
          userId: trevor.id,
          body: "Another $500 landed this month. We're getting close!",
        },
        {
          itemId: grocery.id,
          userId: chanda.id,
          body: "I'll grab the list tonight.",
        },
      ],
    });

    await prisma.activityEvent.create({
      data: {
        householdId: household.id,
        itemId: decision.id,
        actorId: trevor.id,
        eventType: "created",
        summary: "Created by Trevor",
      },
    });

    void lake;
  }

  console.log("Seed complete.");
  console.log("Accounts:");
  console.log("  trevor@together.app / together123");
  console.log("  chanda@together.app / together123");
  console.log("Household:", household.name, household.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
