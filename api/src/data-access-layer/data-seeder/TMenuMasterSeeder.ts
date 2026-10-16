import { ConnectionPool } from "../../data-access-layer/database";

interface MenuSeed {
    active: number;
    displayOrder: number;
    icon: string;
    label: string;
    parentLabel: string | null;
    route: string | null;
}

const menuItems: MenuSeed[] = [
    {
        active: 1,
        displayOrder: 1,
        icon: "bi bi-house",
        label: "Dashboard",
        parentLabel: null,
        route: "/dashboard"
    },
    {
        active: 1,
        displayOrder: 2,
        icon: "bi bi-diagram-3",
        label: "Content",
        parentLabel: null,
        route: "/content"
    },
    {
        active: 1,
        displayOrder: 3,
        icon: "bi bi-star-fill",
        label: "Favourite",
        parentLabel: null,
        route: "/favourite"
    },
    {
        active: 1,
        displayOrder: 4,
        icon: "bi bi-trash",
        label: "Recycle Bin",
        parentLabel: null,
        route: "/recycle-bin"
    },
    {
        active: 1,
        displayOrder: 5,
        icon: "bi bi-gear",
        label: "Settings",
        parentLabel: null,
        route: null
    },
    {
        active: 1,
        displayOrder: 6,
        icon: "bi bi-person-circle",
        label: "Profile",
        parentLabel: null,
        route: "/profile"
    },
    {
        active: 1,
        displayOrder: 7,
        icon: "bi bi-box-arrow-in-right",
        label: "Login",
        parentLabel: null,
        route: "/login"
    },
    {
        active: 1,
        displayOrder: 8,
        icon: "bi bi-person-add",
        label: "Register",
        parentLabel: null,
        route: "/register"
    },
    {
        active: 1,
        displayOrder: 9,
        icon: "bi bi-box-arrow-left",
        label: "Logout",
        parentLabel: null,
        route: "/logout"
    },
    {
        active: 1,
        displayOrder: 1,
        icon: "bi bi-person-gear",
        label: "Profile Settings",
        parentLabel: "Settings",
        route: "/settings/profile-settings"
    },
    {
        active: 1,
        displayOrder: 2,
        icon: "bi bi-sliders2",
        label: "Basic Settings",
        parentLabel: "Settings",
        route: "/settings/basic-settings"
    },
    {
        active: 1,
        displayOrder: 3,
        icon: "bi bi-person-slash",
        label: "Delete Account",
        parentLabel: "Settings",
        route: "/settings/delete-account"
    }
];

export async function SeedTMenuMaster(): Promise<void> {
    const pool = await ConnectionPool;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const menuIds = new Map<string, number>();

        for (const item of menuItems) {
            let parentId: number | null = null;

            if (item.parentLabel !== null) {
                const parent = menuIds.get(item.parentLabel);

                if (parent === undefined) {
                    throw new Error(
                        `Parent menu "${item.parentLabel}" was not found`
                    );
                }

                parentId = parent;
            }

            const [existing] = await connection.execute<any[]>(
                `SELECT ID
                 FROM T_MENU_MASTER
                 WHERE LABEL = ?
                   AND PARENT_ID <=> ?
                 LIMIT 1`,
                [item.label, parentId]
            );

            let menuId: number;

            if (existing.length > 0) {
                menuId = existing[0].ID;
            } else {
                const [result] = await connection.execute<any>(
                    `INSERT INTO T_MENU_MASTER
                        (ACTIVE, DISPLAY_ORDER, ICON, LABEL, PARENT_ID, ROUTE)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        item.active,
                        item.displayOrder,
                        item.icon,
                        item.label,
                        parentId,
                        item.route
                    ]
                );

                menuId = result.insertId;
            }

            menuIds.set(item.label, menuId);
        }

        await connection.commit();

        console.log("✅ T_MENU_MASTER Seeded Successfully.");
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}