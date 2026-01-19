import { randomUUID } from 'crypto';
import { getDataSource } from '../db/data-source.js';
import { User } from '../db/entities/User.js';
import { hashPassword, validatePassword } from '../utils/password.js';

/**
 * Script to manually add a user to the database
 * Usage: tsx src/scripts/add-user.ts <email> <password> <platformRole>
 */

async function addUser(email: string, password: string, platformRole: 'admin' | 'developer' | 'user') {
  try {
    // Validate password
    const validation = validatePassword(password);
    if (!validation.valid) {
      console.error('❌ Password does not meet requirements:');
      validation.errors.forEach(err => console.error(`   - ${err}`));
      process.exit(1);
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await hashPassword(password);

    const userId = randomUUID();
    const now = Date.now();

    const dataSource = await getDataSource();
    const userRepo = dataSource.getRepository(User);
    
    // Check if user already exists
    const existingUser = await userRepo.createQueryBuilder('u')
      .where('LOWER(u.email) = LOWER(:email)', { email })
      .getOne();
    
    if (existingUser) {
      console.error(`❌ User with email ${email} already exists`);
      process.exit(1);
    }

    console.log(`👤 Creating user ${email}...`);
    await userRepo.insert({
      id: userId,
      email,
      passwordHash,
      firstName: null,
      lastName: null,
      platformRole,
      isActive: true,
      mustResetPassword: false,
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now,
      authProvider: 'local',
    });

    console.log('✅ User created successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   Platform Role: ${platformRole}`);
    console.log(`   ID: ${userId}`);
  } catch (error) {
    console.error('❌ Failed to create user:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: tsx src/scripts/add-user.ts <email> <password> <platformRole>');
  console.error('Example: tsx src/scripts/add-user.ts user@example.com MyPass123! admin');
  process.exit(1);
}

const [email, password, platformRole] = args;

if (platformRole !== 'admin' && platformRole !== 'developer' && platformRole !== 'user') {
  console.error('❌ Platform role must be "admin", "developer", or "user"');
  process.exit(1);
}

addUser(email, password, platformRole as 'admin' | 'developer' | 'user');
