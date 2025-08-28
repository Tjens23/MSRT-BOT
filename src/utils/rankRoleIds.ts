// Define which roles are considered "ranks" that should be tracked
// Add or remove role IDs as needed for your server
const rankRoles = [
    '1277312995558690935', // Staff role
    '1019122755125379102', // Another rank role (example)
    '1298800303491121223', // Another rank role (example)
    // Add more rank role IDs here as needed
    // You can find role IDs by right-clicking on roles in Discord (with developer mode enabled)
];

export const getRankRoleIds = async () => rankRoles;

// You can also define role hierarchies or categories if needed
export const RANK_CATEGORIES = {
    STAFF: ['1277312995558690935'],
    MILITARY: ['1019122755125379102', '1298800303491121223'],
    // Add more categories as needed
};

export const isRankRole = (roleId: string): boolean => {
    return rankRoles.includes(roleId);
};
