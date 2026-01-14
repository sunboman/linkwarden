-- AlterTable
ALTER TABLE "User" ADD COLUMN     "archiveOrgProxyDomains" TEXT[] DEFAULT ARRAY[]::TEXT[];
