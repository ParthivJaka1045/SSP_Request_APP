import {
  LayoutDashboard,
  Monitor,
  Package,
  Film,
  Plane,
  ShoppingCart,
  FileText,
  Settings,
  ClipboardList,
  Users,
  Boxes,
  Shield,
} from 'lucide-react';
import {
  canAccessModule,
  userHasRole,
  SSP_ROLES,
} from './permissions';

const MODULE_NAV = [
  { id: 'technical', href: '/technical', label: 'Technical', icon: Monitor },
  { id: 'general', href: '/general-store', label: 'General Store', icon: Package },
  { id: 'subscription', href: '/subscription', label: 'Subscription', icon: Film },
  { id: 'travel', href: '/travel', label: 'Going Home', icon: Plane, directForm: true },
];

/** Default landing path per active role. */
export function getHomePathForRole(activeRole) {
  if (activeRole === SSP_ROLES.santo || activeRole === SSP_ROLES.coordinator) {
    return '/orders';
  }
  return '/';
}

/** Flat nav items (legacy / mobile). */
export function getNavItemsForUser(user, activeRole) {
  const sections = getNavSectionsForUser(user, activeRole);
  return sections.flatMap((s) => s.items);

}

/** STK-style grouped nav sections. */
export function getNavSectionsForUser(user, activeRole) {
  const role = activeRole;

  if (role === SSP_ROLES.admin) {
    return [
      {
        title: 'Workspace',
        items: [
          { href: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
          { href: '/orders', label: 'Orders', icon: ClipboardList },
        ],
      },
      {
        title: 'Management',
        items: [
          { href: '/admin/masters', label: 'Masters', icon: Boxes },
          { href: '/admin/users', label: 'Users Manage', icon: Users },
          { href: '/reports', label: 'Reports Admin', icon: Shield },
        ],
      },
    ];
  }

  if (role === SSP_ROLES.hod) {
    return [
      {
        title: 'Workspace',
        items: [
          { href: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
          { href: '/orders', label: 'Orders', icon: ClipboardList },
          { href: '/assigned', label: 'Assign To Me', labelGu: 'મને Assign', icon: ClipboardList },
        ],
      },
      {
        title: 'Management',
        items: [
          { href: '/reports', label: 'Reports Admin', icon: Shield },
        ],
      },
    ];
  }

  if (role === SSP_ROLES.coordinator) {
    return [
      {
        title: 'Workspace',
        items: [
          { href: '/orders', label: 'Orders', icon: ClipboardList },
        ],
      },
    ];
  }

  if (role === SSP_ROLES.santo) {
    return [
      {
        title: 'Workspace',
        items: [
          { href: '/orders', label: 'Orders', icon: ClipboardList },
          { href: '/assigned', label: 'Assign To Me', labelGu: 'મને Assign', icon: ClipboardList },
        ],
      },
      {
        title: 'Insight',
        items: [{ href: '/reports', label: 'Reports Admin', icon: Shield }],
      },
    ];
  }

  const moduleChildren = MODULE_NAV.filter((m) => canAccessModule(user, m.id, activeRole)).map((m) => ({
    href: m.href,
    label: m.label,
    icon: m.icon,
  }));

  return [
    {
      title: 'Workspace',
      items: [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        {
          label: 'Request',
          icon: Package,
          children: moduleChildren,
        },
        { href: '/orders', label: 'My Orders', icon: ClipboardList },
        { href: '/my-reports', label: 'My Reports', icon: FileText },
      ],
    },
  ];
}
