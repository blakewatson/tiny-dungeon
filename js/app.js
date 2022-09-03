import characterTemplate from './templates/character.js';
import controlsTemplate from './templates/controls.js';
import locationTemplate from './templates/location.js';
import playerMarkerTemplate from './templates/playerMarker.js';

// -- Constants -----------------------------------

const races = {
  1: { name: 'Halfling', bonusAgainst: [1, 6] },
  3: { name: 'Dwarf', bonusAgainst: [2, 5] },
  2: { name: 'Elf', bonusAgainst: [3, 4] }
};

// room status: 0=open, 1=cleared
const rooms = {
  1: { name: 'Shop', status: 1, adjacent: [4, 2] },
  2: { name: 'Tomb', status: 0, adjacent: [1, 3] },
  3: { name: 'Camp', status: 0, adjacent: [2] },
  4: { name: 'Cave', status: 0, adjacent: [5, 1] },
  5: { name: 'Den', status: 0, adjacent: [4] }
};

const RoomStatus = {
  Open: 0,
  Clear: 1
};

const monsters = {
  1: { id: 1, name: 'Rat', hp: 1 },
  2: { id: 2, name: 'Goblin', hp: 2, roomBonus: 3 },
  3: { id: 3, name: 'Orc', hp: 2, roomBonus: 3 },
  4: { id: 4, name: 'Skeleton mage', hp: 3, roomBonus: 2 },
  5: { id: 5, name: 'Troll', hp: 3, roomBonus: 4 },
  6: { id: 6, name: 'Dragon', hp: 5, roomBonus: 5 }
};

const Items = {
  Gold_1: 1,
  Gold_2: 2,
  Sword: 3,
  Armor: 4,
  Potion: 5,
  Amulet: 6
};

const itemsDisplay = {
  1: '1 Gold coin',
  2: '2 Gold coins',
  3: 'Sword (+1)',
  4: 'Armor (+1)',
  5: 'Healing potion ♥',
  6: 'Amulet (+1)'
};

let state = null;

// -- /Constants --

// -- Game functions ------------------------------

function main() {
  // state.character = 1;
  // state.name = 'Frodo';
  // nextLevel();
  state = stateFactory();
  render();
}

function attack() {
  state.message = '';

  let attackBonus = Object.keys(state.inventory).reduce((acc, key) => {
    key = parseInt(key);

    if (key === Items.Amulet || key === Items.Sword) {
      acc++;
    }

    return acc;
  }, 0);

  if (races[state.character].bonusAgainst.includes(state.activeMonster.id)) {
    attackBonus++;
  }

  const results = [];

  for (let i = 0; i <= attackBonus; i++) {
    results.push(roll());
  }

  const playerRoll = results.reduce((acc, val) => (val > acc ? val : acc), 0);

  const armorBonus = Object.keys(state.inventory).reduce((acc, key) => {
    key = parseInt(key);

    if (key === Items.Armor) {
      acc++;
    }

    return acc;
  }, 0);

  const monsterResults = [];

  for (let i = 0; i <= armorBonus; i++) {
    monsterResults.push(roll());
  }

  const monsterRoll = monsterResults.reduce(
    (acc, val) => (val < acc ? val : acc),
    7
  );

  if (success(playerRoll)) {
    state.activeMonster.hp--;
    state.message += `You hit the ${state.activeMonster.name} with a roll of ${playerRoll}. `;
  } else {
    state.message += `You missed... `;
  }

  if (success(monsterRoll)) {
    state.hp--;
    state.message += `The ${state.activeMonster.name} hit you with a roll of ${monsterRoll}!`;
  } else {
    state.message += `The ${state.activeMonster.name} attacked you but missed.`;
  }

  if (state.activeMonster.hp === 0) {
    state.message += ` You killed the ${state.activeMonster.name}!`;
    state.activeMonster = false;
    rooms[state.room].status = RoomStatus.Clear;

    if (state.hp) {
      state.playerCanMove = true;
    }

    // chance of loot drop
    if (success(roll())) {
      handleItem();
    }
  }

  if (state.hp === 0) {
    state.message += ` You met your unfortunate demise.`;
  }

  render();
}

function buyHealingPotion() {
  if (state.gold < 2) {
    state.message = "You don't have enough gold to buy a healing potion.";
    return render();
  }

  state.gold -= 2;
  state.inventory[Items.Potion]++;
  render();
}

function goToRoom(roomNum) {
  state.message = '';
  state.activeMonster = false;
  state.activeTrap = false;
  state.room = roomNum;

  if (rooms[roomNum].status === RoomStatus.Open) {
    const result = roll();

    if (result === 1) {
      // empty room
      state.message = `You look around the ${
        rooms[state.room].name
      }, but it seems empty.`;

      state.playerCanMove = true;
    } else if (result === 2) {
      // trap
      state.activeTrap = true;
      state.message = 'It’s a trap! Roll to avoid.';
      state.playerCanMove = false;
    } else if (result === 6) {
      handleItem();
    } else {
      handleRoom(roomNum);
    }
  } else if (rooms[roomNum].status === RoomStatus.Clear) {
    state.message = 'This place looks familiar.';
  }

  rooms[state.room].status = RoomStatus.Clear;

  render();
}

// new item
function handleItem() {
  let itemRoll = roll();

  if (itemRoll === 6) {
    itemRoll = roll();

    if (itemRoll > 3) {
      // todo: make a better ending
      state.message +=
        ' You found the coveted Amulet&nbsp;of&nbsp;Yendor!&nbsp;★ You win!';
      state.playerCanMove = false;
      state.playerWon = true;
      return render();
    }

    state.message += ' You found an amulet! +1 attack and +1 against traps.';
    state.inventory[Items.Amulet]++;
    return;
  }

  const item = Object.values(Items).filter((n) => n === itemRoll);
  state.message += ` You found an item: ${itemsDisplay[item]}`;
  state.playerCanMove = true;

  // update inventory
  if (itemRoll === Items.Gold_1 || itemRoll === Items.Gold_2) {
    state.gold += itemRoll === Items.Gold_1 ? 1 : 2;
  } else {
    state.inventory[itemRoll]++;
  }
}

function handleRoom(roomNum) {
  // roll for monster, but if we're below level 3 don't allow Dragons
  let result = roll();

  while (result === 6 && state.level < 2) {
    result = roll();
  }

  // monster
  state.activeMonster = { ...monsters[result] };

  // bonus if monster is in preferred room
  if (state.activeMonster.roomBonus === roomNum) {
    state.activeMonster.hp++;
  }

  state.message = `There is a ${state.activeMonster.name}!`;
  state.playerCanMove = false;
}

function nextLevel() {
  if (!allRoomsAreClear() && state.level > 0) {
    state.message = "You haven't cleared all rooms on this level yet.";
    return render();
  }

  state.level++;
  state.room = 1;
  state.gold++;
  state.message =
    "You found a shop. And a gold coin! There's a vending machine... healing potions, 2 gold coins each.";

  resetRooms();

  render();
}

function resetRooms() {
  Object.keys(rooms).forEach((roomNum) => {
    roomNum = parseInt(roomNum);

    if (roomNum === 1) {
      return;
    }

    rooms[roomNum].status = RoomStatus.Open;
  });
}

// amulets provide extra rolls against traps
function rollAgainstTrap() {
  let result = roll();

  for (let i = 0; i < state.inventory[Items.Amulet]; i++) {
    result = Math.max(result, roll());
  }

  if (success(result)) {
    state.message = `You successfully disarmed the trap with a roll of ${result}.`;
  } else {
    state.hp--;
    state.message = `You accidentally triggered the trap!`;
    state.message +=
      state.hp > 0
        ? ` You lost one hit point.`
        : ` You met your unfortunate demise.`;
  }

  if (state.hp) {
    rooms[state.room].status = RoomStatus.Clear;
    state.playerCanMove = true;
  }

  state.activeTrap = false;

  render();
}

function rollCharacter() {
  const result = roll();
  state.character = result > 4 ? 3 : result > 2 ? 2 : 1;
  const race = races[state.character].name;
  const name = prompt(`Enter name for a brave ${race}.`);
  state.name = name || 'Player';
  render();
}

function stateFactory(defaultName = 'Player') {
  resetRooms();

  return {
    name: defaultName,
    character: 0,
    level: 0,
    room: 0,
    hp: 3,
    gold: 0,
    inventory: {
      [Items.Sword]: 0,
      [Items.Armor]: 0,
      [Items.Potion]: 0,
      [Items.Amulet]: 0
    },
    activeMonster: false, // monster object
    activeTrap: false,
    message: '',
    playerCanMove: true,
    playerWon: false,
    races,
    rooms,
    monsters,
    itemsDisplay,
    Items
  };
}

function useHealingPotion() {
  if (!state.inventory[Items.Potion]) {
    state.message = 'You are all out of healing potion!';
    return render();
  }

  if (state.hp === 3) {
    state.message = 'You are already at full health!';
    return render();
  }

  state.inventory[Items.Potion]--;
  state.hp++;
  state.message = 'You recovered a hit point.';
  render();
}

// -- /Game functions --

// -- Render functions ----------------------------

function render() {
  console.log(state);

  renderControls();
  renderCharacter();
  renderLocation();
  renderMarker();
  renderMessage();
}

function renderCharacter() {
  const characterHtml = squirrelly(characterTemplate);
  document.querySelector('.view-character').innerHTML = characterHtml;
}

function renderControls() {
  const controlsHtml = squirrelly(controlsTemplate);
  document.querySelector('.view-controls').innerHTML = controlsHtml;
}

function renderLocation() {
  const locationHtml = squirrelly(locationTemplate);
  document.querySelector('.location').innerHTML = locationHtml;
}

function renderMarker() {
  if (state.room) {
    // location
    const location = rooms[state.room].name.toLowerCase();
    const map = document.querySelector('.map');
    map.dataset.location = location;

    // emoji
    const playerMarkerHtml = squirrelly(playerMarkerTemplate);
    document.querySelector('.player-marker').innerHTML = playerMarkerHtml;
  }
}

function renderMessage() {
  const msg = document.querySelector('.message');
  msg.classList.add('fade-out');

  setTimeout(() => {
    msg.innerHTML = state.message;
    msg.classList.remove('fade-out');
  }, 150);
}

function squirrelly(template, config = { useWith: true }) {
  if (typeof template !== 'string') {
    throw new Error('Template must be a string.');
  }

  template = template.replace('&gt;', '>');

  return Sqrl.render(template, state, config);
}

// -- /Render functions --

// -- Utils ---------------------------------------

const success = (val) => val > 3;

const roll = () => Math.floor(Math.random() * 6) + 1;

const allRoomsAreClear = () =>
  Object.values(rooms).every((room) => room.status === RoomStatus.Clear);

// -- /Utils --

// make these functions available to the window
window.attack = attack;
window.buyHealingPotion = buyHealingPotion;
window.goToRoom = goToRoom;
window.main = main;
window.nextLevel = nextLevel;
window.rollAgainstTrap = rollAgainstTrap;
window.rollCharacter = rollCharacter;
window.useHealingPotion = useHealingPotion;

main();
