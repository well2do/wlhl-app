import { redirect } from "next/navigation";
import { DesignGallery, type DesignGalleryContent } from "./design-gallery";
import { isAdmin } from "@/lib/auth";
import { getAnnouncements, getEvents, getProducts } from "@/lib/db";
import { formatCurrency, formatEventDate, formatEventTime } from "@/lib/format";

export const metadata = {
  title: "Homepage Design Studio",
  robots: { index: false, follow: false },
};

const fallbackProducts = [
  { name: "Daily Vitality Tea", category: "Wellness", price: "$18.00" },
  { name: "Strong for Life Bands", category: "Movement", price: "$24.00" },
  { name: "90-Day Wellness Journal", category: "Mindfulness", price: "$16.00" },
];

export default async function DesignGuiPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const [events, announcements, products] = await Promise.all([
    getEvents(),
    getAnnouncements(2),
    getProducts(),
  ]);
  const nextEvent = events[0];

  const content: DesignGalleryContent = {
    event: nextEvent
      ? {
          title: nextEvent.title,
          description: nextEvent.description,
          date: formatEventDate(nextEvent.event_date, true),
          time: formatEventTime(nextEvent.event_date),
          location: nextEvent.location,
          availability: `${Math.max(nextEvent.capacity - Number(nextEvent.attendee_count || 0), 0)} spots open`,
        }
      : {
          title: "Morning Mobility & Tai Chi",
          description: "A gentle, energizing class focused on balance, flexibility, and everyday strength.",
          date: "Saturday, September 12",
          time: "9:00 AM",
          location: "Rock Creek Community Center",
          availability: "18 spots open",
        },
    announcement: announcements[0]
      ? { title: announcements[0].title, message: announcements[0].message }
      : {
          title: "A healthier season starts together",
          message: "Our new calendar is open for movement, nutrition, and community wellness events.",
        },
    products: products.length
      ? products.slice(0, 3).map((product) => ({
          name: product.name,
          category: product.category,
          price: formatCurrency(Number(product.price)),
        }))
      : fallbackProducts,
  };

  return <DesignGallery content={content} />;
}
