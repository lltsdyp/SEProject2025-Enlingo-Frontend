import { NavItem } from "@/types";

type CourseConfig = {
  sidebarNavItems: NavItem[];
  mobileNavItems: NavItem[];
};

export const courseConfig: CourseConfig = {
  sidebarNavItems: [
    {
      icon: "home",
      label: "Learn",
      href: "/learn",
    },
    {
      icon: "box",
      label: "Recommend",
      href: "/recommend",
    },
    {
      icon: "languageSquare",
      label: "Characters",
      href: "/characters",
    },
    {
      icon: "profile",
      label: "Profile",
      href: "/profile",
    },
  ],
  mobileNavItems: [
    {
      icon: "home",
      label: "Learn",
      href: "/learn",
    },
    {
      icon: "box",
      label: "Recommend",
      href: "/recommend",
    },
    {
      icon: "languageSquare",
      label: "Characters",
      href: "/characters",
    },
    {
      icon: "profile",
      label: "Profile",
      href: "/profile",
    },
  ],
};
