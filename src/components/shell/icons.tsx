import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CalendarClock,
  ClipboardList,
  House,
  PlugZap,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Shirt,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { NavIcon } from "./nav";

export const NAV_ICONS: Record<NavIcon, LucideIcon> = {
  home: House,
  matches: CalendarDays,
  players: Users,
  tables: ClipboardList,
  integrations: PlugZap,
  teams: Shirt,
  sync: RefreshCw,
  issues: AlertTriangle,
  derogations: CalendarClock,
  settings: Settings2,
  platform: ShieldCheck,
  clubs: Building2,
};
