import { getSessionUser, isAdminUser } from "@/lib/auth/require";
import { PublicNavigation } from "./public-navigation";

export async function SiteHeader() {
  const user = await getSessionUser();
  const admin = user ? await isAdminUser(user.id) : false;
  return <PublicNavigation signedIn={Boolean(user)} admin={admin} />;
}
