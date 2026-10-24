import { ConnectionPool } from "../../data-access-layer/database";
import { MenuAccessType } from "../../enum/CommonEnum";

interface MenuSeed {
    active: number;
    displayOrder: number;
    icon: string;
    label: string;
    parentLabel: string | null;
    route: string | null;
    access_type: number;
}

const menuItems: MenuSeed[] = [
    {
        active: 1,
        displayOrder: 1,
        icon: "bi bi-house",
        label: "Dashboard",
        parentLabel: null,
        route: "/dashboard",
        access_type: MenuAccessType.Common
    },
    {
        active: 1,
        displayOrder: 2,
        icon: "bi bi-cloud-arrow-up",
        label: "Upload",
        parentLabel: null,
        route: "/upload",
        access_type: MenuAccessType.Authenticated
    },
    {
        active: 1,
        displayOrder: 3,
        icon: "bi bi-table",
        label: "Datasets",
        parentLabel: null,
        route: null,
        access_type: MenuAccessType.Authenticated
    },
    {
        active: 1,
        displayOrder: 1,
        icon: "bi bi-collection",
        label: "Active Datasets",
        parentLabel: "Datasets",
        route: "/datasets/active",
        access_type: MenuAccessType.Authenticated
    },
    {
        active: 1,
        displayOrder: 2,
        icon: "bi bi-trash3",
        label: "Deleted Datasets",
        parentLabel: "Datasets",
        route: "/datasets/deleted",
        access_type: MenuAccessType.Authenticated
    },
    {
        active: 1,
        displayOrder: 4,
        icon: "bi bi-cpu",
        label: "Processing",
        parentLabel: null,
        route: "/processing",
        access_type: MenuAccessType.Authenticated
    },
    {
        active: 1,
        displayOrder: 5,
        icon: "bi bi-box-arrow-in-right",
        label: "Login",
        parentLabel: null,
        route: "/login",
        access_type: MenuAccessType.NonAuthenticated
    },
    {
        active: 1,
        displayOrder: 6,
        icon: "bi bi-person-add",
        label: "Register",
        parentLabel: null,
        route: "/register",
        access_type: MenuAccessType.NonAuthenticated
    },
    {
        active: 1,
        displayOrder: 7,
        icon: "bi bi-box-arrow-left",
        label: "Logout",
        parentLabel: null,
        route: "/logout",
        access_type: MenuAccessType.Authenticated
    },
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
                        (ACTIVE, DISPLAY_ORDER, ICON, LABEL, PARENT_ID, ROUTE, ACCESS_TYPE)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        item.active,
                        item.displayOrder,
                        item.icon,
                        item.label,
                        parentId,
                        item.route,
                        item.access_type
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