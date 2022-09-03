export default `
{{ @if (playerWon || hp === 0) }}
  <button onclick="main()">Play again</button>
{{ #else }}

  {{ @if (character === 0) }}
  <button onclick="rollCharacter()">Roll Character</button>
  {{ #elif (level === 0) }}
  <button onclick="nextLevel()">Enter Dungeon</button>
  {{ /if }}

  {{ @if (playerCanMove && room > 0) }}
  {{ @each (rooms[room].adjacent) => val, idx }}
    <button onclick="goToRoom({{ val }})">Go to {{ rooms[val].name }}</button>
  {{ /each }}
  {{ /if }}

  {{ @if (activeMonster && hp !== 0) }}
  <button onclick="attack()">Attack!</button>
  {{ #elif }}
  <button onclick="">Roll a new character</button>
  {{ /if }}

  {{ @if (activeTrap) }}
  <button onclick="rollAgainstTrap()">Try to disarm the trap</button>
  {{ /if }}

  {{ @if (room === 5 && playerCanMove) }}
  <button onclick="nextLevel()">Go to level {{ level + 1 }}</button>
  {{ /if }}

  {{ @if (inventory[Items.Potion]) }}
  <button onclick="useHealingPotion()">Use a healing potion</button>
  {{ /if }}

  {{ @if (room === 1) }}
  <button onclick="buyHealingPotion()">Buy a healing potion</button>
  {{ /if }}

{{ /if }}

`;
