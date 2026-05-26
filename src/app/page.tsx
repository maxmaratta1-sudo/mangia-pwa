// Root "/" redirects to "/it" via next-intl middleware.
// This file handles the rare case where middleware doesn't catch it.
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/it");
}
