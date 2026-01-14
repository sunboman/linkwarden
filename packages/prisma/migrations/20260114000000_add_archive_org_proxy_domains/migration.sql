-- AlterTable (idempotent - column may already exist from db push)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'archiveOrgProxyDomains'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "archiveOrgProxyDomains" TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;
