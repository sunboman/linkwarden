# Upgrade Notes

## True Archive Feature

1. Run the Prisma migration to add the `archived` field to the `Link` table:
   ```bash
   yarn prisma db push
   ```
   (Or `yarn prisma migrate deploy` if using migrations workflow).
