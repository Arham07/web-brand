import { notFound } from "next/navigation";
import PlaceholderPage from "@/components/shared/PlaceholderPage";

// Work-detail slugs linked from the home gallery.
const WORK_SLUGS: Record<string, string> = {
  work_co: "Work — CO",
  work_food: "Work — Food",
  work_nod: "Work — NOD",
  work_oil: "Work — Oil",
  work_camp: "Work — Camp",
  work_cnc: "Work — CNC",
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const title = WORK_SLUGS[slug];
  if (!title) notFound();
  return <PlaceholderPage title={title} caption="Selected Work" />;
}
