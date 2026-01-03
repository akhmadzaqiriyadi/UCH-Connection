
import { db } from './src/db';
import { prodi } from './src/db/schema';

const p = await db.select().from(prodi).limit(1);
console.log(p[0]?.id);
process.exit(0);
