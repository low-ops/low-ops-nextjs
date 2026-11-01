import { getDefaultAuthPath } from "@/lib/founding-admins";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home",
};

const HomePage = async () => {
  redirect(await getDefaultAuthPath());
};

export default HomePage;
