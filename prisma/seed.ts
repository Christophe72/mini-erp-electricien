/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.userSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      activityName: 'Électricité Christophe',
      monthlyLimit: 1500,
      currency: 'EUR',
    },
  });

  const client = await prisma.client.create({
    data: {
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '0470 00 00 00',
      email: 'jean.dupont@example.com',
      address: 'Rue des Artisans 12',
      postalCode: '4000',
      city: 'Liège',
      notes: 'Client calme, préfère le matin.',
    },
  });

  await prisma.intervention.createMany({
    data: [
      {
        clientId: client.id,
        date: new Date(),
        workType: 'Remplacement interrupteur',
        description: 'Interrupteur cuisine défectueux',
        status: 'TERMINEE',
        plannedAmount: 85,
        receivedAmount: 85,
        paymentMethod: 'VIREMENT',
      },
      {
        clientId: client.id,
        date: new Date(),
        workType: 'Ajout prise',
        description: 'Nouvelle prise dans séjour',
        status: 'A_FAIRE',
        plannedAmount: 120,
        receivedAmount: 0,
        paymentMethod: 'VIREMENT',
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
