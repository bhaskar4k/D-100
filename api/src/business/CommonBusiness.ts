import { ConnectionPool } from "../data-access-layer/database";
import { MenuItem, MenuRow } from "../entity/CommonEntity";


export class UserBusiness {
    static async DoGetMenu(): Promise<MenuItem[]> {
        try {
            const pool = await ConnectionPool;

            const [rows] = await pool.query<MenuRow[]>(`
            SELECT id, label, icon, route, parent_id, display_order
            FROM t_menu_master
            WHERE active = 1
            ORDER BY display_order ASC
        `);

            const menuMap = new Map<number, MenuItem>();
            const rootMenus: MenuItem[] = [];

            // Create every menu item first.
            for (const row of rows) {
                menuMap.set(row.id, {
                    id: row.id,
                    label: row.label,
                    icon: row.icon,
                    route: row.route,
                    submenu: []
                });
            }

            // Build the parent-child hierarchy.
            for (const row of rows) {
                const menuItem = menuMap.get(row.id)!;

                if (row.parent_id === null) {
                    rootMenus.push(menuItem);
                } else {
                    const parentMenu = menuMap.get(row.parent_id);

                    if (parentMenu) {
                        parentMenu.submenu.push(menuItem);
                    }
                }
            }

            return rootMenus;
        } catch (error: any) {
            throw error;
        }
    }
}