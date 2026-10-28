import { ConnectionPool } from "../data-access-layer/database";
import { RedisConnection } from "../config/RedisConfig";
import { UserData } from "../entity/AuthenticationEntity";
import { MenuItem, MenuRow } from "../entity/CommonEntity";
import { MenuAccessType } from "../enum/CommonEnum";
import { Logger } from "../log/Logger";


// Separate cache per audience so an authenticated user never sees the public menu and vice
// versa. Each variant is populated on first access and reused on every subsequent call.
// Cached forever: the menu changes only via a reseed, and that path should flush these keys.
function MenuCacheKey(IsAuthenticated: boolean): string {
    return IsAuthenticated ? "MENU-AUTH" : "MENU-NONAUTH";
}


export class UserBusiness {
    static async DoGetMenu(User: UserData): Promise<MenuItem[]> {
        const isAuthenticated = User.auth === true;
        const cacheKey = MenuCacheKey(isAuthenticated);
        const redis = await RedisConnection;

        // Cache lookup never fails the request: a Redis blip just falls through to the DB and
        // tries to repopulate below.
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached) as MenuItem[];
            }
        } catch (error) {
            await Logger.Error(`Menu cache read failed for '${cacheKey}'.`, error);
        }

        const pool = await ConnectionPool;

        const SubQuery = isAuthenticated ?
            `AND (access_type = ${MenuAccessType.Authenticated} OR
            access_type = ${MenuAccessType.Common})` :
            `AND (access_type = ${MenuAccessType.NonAuthenticated} OR
            access_type = ${MenuAccessType.Common})`;

        const [rows] = await pool.query<MenuRow[]>(`
            SELECT id, label, icon, route, parent_id, display_order
            FROM t_menu_master
            WHERE active = 1
            ${SubQuery}
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

        // Cache write is best-effort: the caller already has a valid menu, so a failed SET
        // just means the next request will rebuild from the DB again.
        try {
            await redis.set(cacheKey, JSON.stringify(rootMenus));
        } catch (error) {
            await Logger.Error(`Menu cache write failed for '${cacheKey}'.`, error);
        }

        return rootMenus;
    }
}
