export default `

{{ @if (character === 0) }}
  <button onclick="rollCharacter()">Roll Character</button>
{{ #elif (level === 0) }}
  <button onclick="nextLevel()">Enter Dungeon</button>
{{ /if }}

{{ @if (playerCanMove) }}
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
`;
