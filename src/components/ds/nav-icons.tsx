/**
 * Nav / page-header icons — Phosphor filled icons.
 * Single source of truth — import from here, never redefine.
 */

import {
  CheckCircle,
  ClipboardText,
  Crosshair,
  Flask,
  GearSix,
  House,
  ListBullets,
  Package,
  PlusSquare,
  FileText,
  RocketLaunch,
  Stack,
  Truck,
  UserCircle,
  Users,
} from '@phosphor-icons/react'

type IC = React.FC<{ className?: string }>

export const IDashboard: IC = ({ className }) => <House className={className} weight="fill" />
export const IProjects: IC = ({ className }) => <Stack className={className} weight="fill" />
export const ICustomers: IC = ({ className }) => <Users className={className} weight="fill" />
export const IUser: IC = ({ className }) => <UserCircle className={className} weight="fill" />
export const IOrders: IC = ({ className }) => <Package className={className} weight="fill" />
export const IProposals: IC = ({ className }) => <FileText className={className} weight="fill" />
export const ITodos: IC = ({ className }) => <CheckCircle className={className} weight="fill" />
export const IOrderDesk: IC = ({ className }) => <PlusSquare className={className} weight="fill" />
export const IShipping: IC = ({ className }) => <Truck className={className} weight="fill" />
export const ISettings: IC = ({ className }) => <GearSix className={className} weight="fill" />
export const ITesting: IC = ({ className }) => <Flask className={className} weight="fill" />
export const IPickLists: IC = ({ className }) => <ClipboardText className={className} weight="fill" />
export const IDev: IC = ({ className }) => <RocketLaunch className={className} weight="fill" />
export const IPicking: IC = ({ className }) => <Crosshair className={className} weight="fill" />
export const IActivity: IC = ({ className }) => <ListBullets className={className} weight="fill" />
