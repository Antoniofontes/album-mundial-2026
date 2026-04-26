import { TabBar } from "@/components/TabBar";
import { CollectionLoader } from "@/components/CollectionLoader";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <CollectionLoader />
      <main className="with-tabbar min-h-screen">{children}</main>
      <TabBar />
    </>
  );
}
