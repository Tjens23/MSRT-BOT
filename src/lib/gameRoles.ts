/**
 * Game Role Configuration
 * Replace the role IDs with your actual Discord role IDs
 */

export interface GameRole {
	name: string;
	roleId: string;
	emoji: string;
}

// Tactical Games - Replace role IDs with your actual role IDs
export const TACTICAL_GAMES: GameRole[] = [
	{ name: 'Ready or Not', roleId: '1019144394449895504', emoji: '<:ReadyorNot:1038570451082956962>' },
	{ name: 'Ground Branch', roleId: '1038568343529066598', emoji: '<:GroundBranch:1038570363480723588>' },
	{ name: 'Zero Hour', roleId: '1038568362613162105', emoji: '<:ZeroHour:1038570536982282341>' },
	{ name: 'Ghost Recon', roleId: '1038568382582243338', emoji: '<:GhostRecon:1038570416484130888>' },
	{ name: 'Arma 3', roleId: '1038573014402473995', emoji: '<:Arma3:1038572928159187024>' },
	{ name: 'Insurgency Sandstorm', roleId: '1107453179236450325', emoji: '<:InsurgencySandstorm:1107454181314400266>' },
	{ name: 'Hell Let Loose', roleId: '1111799990268993567', emoji: '<:hellletloose:1329230404422471820>' },
	{ name: 'Door Kickers', roleId: '1119824957246021667', emoji: '<:doorkickers:1119825617349779516>' },
	{ name: 'Six Days in Fallujah', roleId: '1121716725566677022', emoji: '<:6DaysinFallujah:1122007059228016730>' },
	{ name: 'Tactical Assault VR', roleId: '1192924750339649536', emoji: '<:TAVR:1192925262128631859>' },
	{ name: 'Squad', roleId: '1213907510696615977', emoji: '<:squad:1213907811105247242>' },
	{ name: 'Operator', roleId: '1277677513308373064', emoji: '<:Operator:1277677320441958522>' },
	{ name: 'Arma Reforger', roleId: '1470898867695517706', emoji: '<:reforger:1471946837970653266> ' }
];

// Casual Games - Replace role IDs with your actual role IDs
export const CASUAL_GAMES: GameRole[] = [
	{ name: 'Phasmophobia', roleId: '1069822636273696838', emoji: '👻' },
	{ name: 'Project Zomboid', roleId: '1069822955166629888', emoji: '🧟' },
	{ name: 'For Honor', roleId: '1129125804027166800', emoji: '⚔️' },
	{ name: 'Hunt Showdown', roleId: '1130975325371768983', emoji: '🔫' },
	{ name: 'GTFO', roleId: '1133787507692163133', emoji: '🔦' },
	{ name: 'VTOL VR', roleId: '1194350430508036137', emoji: '✈️' },
	{ name: 'Helldivers 2', roleId: '1206647682966495302', emoji: '🪖' },
	{ name: 'Demonologist', roleId: '1416563154573594705', emoji: '😈' },
	{ name: 'Space Marine 2', roleId: '1282897739046191114', emoji: '🚀' },
	{ name: 'Mage Arena', roleId: '1416563373218467921', emoji: '🧙' }
];
