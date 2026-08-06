import { redirect } from "next/navigation";

const HomePage = () => {
  redirect("/auth/login");
};

export default HomePage;
