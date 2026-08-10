import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Home",
};

const HomePage = () => {
  redirect("/auth/sign-in");
};

export default HomePage;
