# Upgrade Notes

## Reading Progress & Archive Queue

1. Run the new Prisma migration to add the `ReadingProgress` table and `readAt` column:
   ```bash
   yarn prisma:generate
   yarn prisma:deploy
   ```
2. Configure Redis and expose the connection string via `REDIS_URL` to enable the new archive queue.
3. Start the archive worker alongside the existing worker processes:
   ```bash
   yarn worker:start
   ```
   The worker automatically registers the queue listener when `REDIS_URL` is set.
