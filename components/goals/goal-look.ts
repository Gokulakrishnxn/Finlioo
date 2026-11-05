import {
  Car,
  GraduationCap,
  Heart,
  House,
  Palmtree,
  Plane,
  ShieldCheck,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { GoalCategory } from "@/lib/types";

export const GOAL_ICONS: Record<GoalCategory, LucideIcon> = {
  emergency: ShieldCheck,
  home: House,
  car: Car,
  education: GraduationCap,
  wedding: Heart,
  retirement: Palmtree,
  travel: Plane,
  other: Target,
};

export const GOAL_TEMPLATES: { category: GoalCategory; name: string; hint: string }[] = [
  { category: "emergency", name: "Emergency fund", hint: "For the unexpected" },
  { category: "home", name: "Home deposit", hint: "Your down payment" },
  { category: "car", name: "New car", hint: "Pay more upfront" },
  { category: "education", name: "Education", hint: "Tuition and courses" },
  { category: "wedding", name: "Wedding", hint: "The big day" },
  { category: "retirement", name: "Retirement", hint: "Your later years" },
  { category: "travel", name: "Travel", hint: "Your next trip" },
];
