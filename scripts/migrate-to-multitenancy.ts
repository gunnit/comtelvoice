/**
 * Migration Script: Multi-Tenancy Setup
 *
 * This script creates a default Comtel Italia user and associates
 * all existing data (calls, callbacks, messages) with that user.
 *
 * Usage: npx tsx scripts/migrate-to-multitenancy.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEFAULT_USER = {
  email: 'admin@comtelitalia.it',
  password: 'ComtelAdmin2024!', // Change after first login!
  name: 'Amministratore',
  companyName: 'Comtel Italia',
};

// Known Twilio phone numbers to associate with the default user
// Add your Twilio numbers here
const PHONE_NUMBERS = [
  { number: '+390220527877', label: 'Linea Principale' },
  // Add more phone numbers as needed
];

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        Multi-Tenancy Migration Script                      ║');
  console.log('║        Comtel Voice Agent                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Step 1: Create or find default user
    console.log('Step 1: Creating default user...');
    const passwordHash = await bcrypt.hash(DEFAULT_USER.password, 12);

    const defaultUser = await prisma.user.upsert({
      where: { email: DEFAULT_USER.email },
      update: {},
      create: {
        email: DEFAULT_USER.email,
        passwordHash,
        name: DEFAULT_USER.name,
        companyName: DEFAULT_USER.companyName,
        isActive: true,
      },
    });

    console.log(`   ✓ Default user created/found: ${defaultUser.email}`);
    console.log(`   ✓ User ID: ${defaultUser.id}`);
    console.log('');

    // Step 2: Create phone number entries
    console.log('Step 2: Associating phone numbers...');
    for (const pn of PHONE_NUMBERS) {
      try {
        await prisma.phoneNumber.upsert({
          where: { number: pn.number },
          update: { userId: defaultUser.id },
          create: {
            number: pn.number,
            label: pn.label,
            userId: defaultUser.id,
          },
        });
        console.log(`   ✓ Phone number associated: ${pn.number} (${pn.label})`);
      } catch (error) {
        console.log(`   ⚠ Phone number already exists: ${pn.number}`);
      }
    }
    console.log('');

    // Step 3: Update all existing calls
    console.log('Step 3: Updating existing calls...');
    const callsResult = await prisma.call.updateMany({
      where: { userId: null },
      data: { userId: defaultUser.id },
    });
    console.log(`   ✓ Updated ${callsResult.count} calls`);
    console.log('');

    // Step 4: Update all existing callbacks
    console.log('Step 4: Updating existing callbacks...');
    const callbacksResult = await prisma.callback.updateMany({
      where: { userId: null },
      data: { userId: defaultUser.id },
    });
    console.log(`   ✓ Updated ${callbacksResult.count} callbacks`);
    console.log('');

    // Step 5: Update all existing messages
    console.log('Step 5: Updating existing messages...');
    const messagesResult = await prisma.message.updateMany({
      where: { userId: null },
      data: { userId: defaultUser.id },
    });
    console.log(`   ✓ Updated ${messagesResult.count} messages`);
    console.log('');

    // Summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                     Migration Complete!                    ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  Default User: ${DEFAULT_USER.email.padEnd(40)} ║`);
    console.log(`║  Password: ${DEFAULT_USER.password.padEnd(45)} ║`);
    console.log('║                                                            ║');
    console.log('║  ⚠  IMPORTANT: Change the password after first login!     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error);
    console.error('');
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
