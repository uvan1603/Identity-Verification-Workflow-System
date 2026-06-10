import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.ruleApplication.deleteMany();
  await prisma.verificationCheck.deleteMany();
  await prisma.documentVerification.deleteMany();
  await prisma.document.deleteMany();
  await prisma.personalInformation.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.rule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemConfig.deleteMany();

  // Create admin user
  const adminPassword = await hashPassword('AdminPassword123!');
  const admin = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'admin@example.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Create compliance manager
  const managerPassword = await hashPassword('ManagerPassword123!');
  const manager = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'manager@example.com',
      passwordHash: managerPassword,
      firstName: 'Compliance',
      lastName: 'Manager',
      role: 'COMPLIANCE_MANAGER',
      isActive: true,
    },
  });

  // Create reviewer
  const reviewerPassword = await hashPassword('ReviewerPassword123!');
  const reviewer = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'reviewer@example.com',
      passwordHash: reviewerPassword,
      firstName: 'Review',
      lastName: 'Specialist',
      role: 'REVIEWER',
      isActive: true,
    },
  });

  // Create customer
  const customerPassword = await hashPassword('CustomerPassword123!');
  const customer = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'customer@example.com',
      passwordHash: customerPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER',
      isActive: true,
    },
  });

  // Create sample rules
  await prisma.rule.create({
    data: {
      id: uuidv4(),
      name: 'Minimum Age Requirement',
      description: 'Verify user is at least 18 years old',
      ruleType: 'AGE_REQUIREMENT',
      priority: 1,
      isActive: true,
      conditions: JSON.stringify({
        minAge: 18,
      }),
      actions: JSON.stringify({
        onFail: 'reject',
        onPass: 'continue',
      }),
    },
  });

  await prisma.rule.create({
    data: {
      id: uuidv4(),
      name: 'Country Restriction',
      description: 'Restrict verification from certain countries',
      ruleType: 'COUNTRY_RESTRICTION',
      priority: 2,
      isActive: true,
      conditions: JSON.stringify({
        blockedCountries: ['KP', 'IR', 'SY'],
      }),
      actions: JSON.stringify({
        onFail: 'reject',
        onPass: 'continue',
      }),
    },
  });

  await prisma.rule.create({
    data: {
      id: uuidv4(),
      name: 'Document Expiry Check',
      description: 'Ensure submitted documents are not expired',
      ruleType: 'DOCUMENT_EXPIRY',
      priority: 1,
      isActive: true,
      conditions: JSON.stringify({
        checkExpiry: true,
      }),
      actions: JSON.stringify({
        onFail: 'reject_with_resubmission',
        onPass: 'continue',
      }),
    },
  });

  // Create system configuration
  await prisma.systemConfig.create({
    data: {
      id: uuidv4(),
      key: 'max_verification_attempts',
      value: '3',
      description: 'Maximum number of verification attempts allowed',
      isSecret: false,
    },
  });

  await prisma.systemConfig.create({
    data: {
      id: uuidv4(),
      key: 'verification_expiry_days',
      value: '30',
      description: 'Number of days before a verification expires',
      isSecret: false,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('\nTest Credentials:');
  console.log('├─ Admin: admin@example.com / AdminPassword123!');
  console.log('├─ Manager: manager@example.com / ManagerPassword123!');
  console.log('├─ Reviewer: reviewer@example.com / ReviewerPassword123!');
  console.log('└─ Customer: customer@example.com / CustomerPassword123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
