/**
 * Nav / page-header icons — Phosphor filled icons.
 * Single source of truth — import from here, never redefine.
 */

import {
  CheckCircle,
  Flask,
  GearSix,
  House,
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
export const IDev: IC = ({ className }) => <RocketLaunch className={className} weight="fill" />
