import { RowDataPacket } from "mysql2";

export interface MenuItem {
  id: number;
  label: string;
  icon: string;
  route: string | null;
  submenu: MenuItem[];
}

export interface MenuRow extends RowDataPacket {
    id: number;
    label: string;
    icon: string;
    route: string | null;
    parent_id: number | null;
    display_order: number;
}