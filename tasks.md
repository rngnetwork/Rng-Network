- [x] `Collapse All` button to all accordions
- [x] dashboard/botconfig route: 
 * new subtab(in navBar) [Module Display Names], and [Network Keys Display Names]
 * networkKeys categorize, by name and description, logic reside in backend strictly.
 * "Master Module Activation\n Enable or disable all automated background features for Antinuke" 
  -> "Module Activation\n Enable or disable all automated background features for Antinuke"
 * Make valuesByGuild's [Server + Value] row properly flex aligned in y-axis, put the serverIDs in the server name itself("${serverName} + " " + {serverID}")
- [x] in role, channel and server select menus, add a search bar in them too.
- [x] for all input fields except the Boolean, in the placeholder="" text, add this:
 * default: $value$,type: $dataType$
 <example>
 	<case>For a input field, with dataType INTEGER, and default value 5</case>
 	<solution>placeholder="default: $value$, type: $dataType$"</solution>
 </example>
