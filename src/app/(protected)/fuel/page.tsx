import { FuelBrowser } from "@/components/fuel/fuel-browser";
import { getDietPlansForUser } from "@/lib/supabase/content";

export default async function FuelPage() {
  const plans = await getDietPlansForUser();

  return <FuelBrowser plans={plans} />;
}
