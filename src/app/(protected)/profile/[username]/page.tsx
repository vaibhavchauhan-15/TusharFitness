import { notFound } from "next/navigation";
import { ProfileOverview } from "@/components/profile/profile-overview";
import { getSessionState } from "@/lib/session";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await getSessionState();

  if (!session || session.user.username !== username) {
    notFound();
  }

  return <ProfileOverview user={session.user} />;
}
