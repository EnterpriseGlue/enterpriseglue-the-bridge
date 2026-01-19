import { getDataSource } from '../db/data-source.js';
import { User } from '../db/entities/User.js';

/**
 * Script to verify a user exists in the database
 * Usage: tsx src/scripts/verify-user.ts <email>
 */

async function verifyUser(email: string) {
  try {
    const dataSource = await getDataSource();
    const userRepo = dataSource.getRepository(User);
    
    const user = await userRepo.createQueryBuilder('u')
      .select(['u.id', 'u.email', 'u.platformRole', 'u.isActive', 'u.authProvider'])
      .where('LOWER(u.email) = LOWER(:email)', { email })
      .getOne();
    
    if (!user) {
      console.log(`❌ User ${email} not found`);
      process.exit(1);
    }
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Platform Role: ${user.platformRole}`);
    console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
    console.log(`   Auth Provider: ${user.authProvider}`);
  } catch (error) {
    console.error('❌ Failed to verify user:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: tsx src/scripts/verify-user.ts <email>');
  console.error('Example: tsx src/scripts/verify-user.ts user@example.com');
  process.exit(1);
}

const [email] = args;
verifyUser(email);
