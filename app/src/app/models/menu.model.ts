export interface MenuItem {
  id: number;
  label: string;
  icon: string;
  route: string | null;
  submenu: MenuItem[];
}
