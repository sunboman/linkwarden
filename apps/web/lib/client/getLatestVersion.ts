export default async function getLatestVersion(setShowAnnouncement: Function) {
  try {
    const announcementId = localStorage.getItem("announcementId");

    const response = await fetch(
      `https://blog.linkwarden.app/latest-announcement.json`
    );

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    const latestAnnouncement = data.id;

    if (announcementId !== latestAnnouncement) {
      setShowAnnouncement(true);
      localStorage.setItem("announcementId", latestAnnouncement);
    }
  } catch (error) {
    console.error("Failed to fetch latest announcement:", error);
  }
}
