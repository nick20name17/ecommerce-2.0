/**
 * Nav / page-header icons — Lucide icons.
 * Single source of truth — import from here, never redefine.
 */

import {
  CheckCircle2,
  ClipboardList,
  Crosshair,
  FlaskConical,
  Home,
  LayoutList,
  ListChecks,
  Package,
  Rocket,
  Settings,
  SquarePlus,
  FileText,
  Truck,
  UserCircle2,
  Users,
} from 'lucide-react'

type IC = React.FC<{ className?: string }>

export const IDashboard: IC = ({ className }) => <Home className={className} />
export const IProjects: IC = ({ className }) => <LayoutList className={className} />
export const ICustomers: IC = ({ className }) => <Users className={className} />
export const IUser: IC = ({ className }) => <UserCircle2 className={className} />
export const IOrders: IC = ({ className }) => <Package className={className} />
export const IProposals: IC = ({ className }) => <FileText className={className} />
export const ITodos: IC = ({ className }) => <CheckCircle2 className={className} />
export const IOrderDesk: IC = ({ className }) => <SquarePlus className={className} />
export const IShipping: IC = ({ className }) => <Truck className={className} />
export const ISettings: IC = ({ className }) => <Settings className={className} />
export const ITesting: IC = ({ className }) => <FlaskConical className={className} />
export const IPickLists: IC = ({ className }) => <ClipboardList className={className} />
export const IDev: IC = ({ className }) => <Rocket className={className} />
export const IPicking: IC = ({ className }) => <Crosshair className={className} />
export const IActivity: IC = ({ className }) => <ListChecks className={className} />
