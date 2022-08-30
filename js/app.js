import characterTemplate from './templates/character.js';
import controlsTemplate from './templates/controls.js';
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

const state = {
  name: 'Player',
  character: 0,
  level: 0,
  room: 0,
  hp: 3,
  gold: 0,
  inventory: [],
  activeMonster: false, // monster object
  activeTrap: false,
  message: '',
  playerCanMove: true,
  races,
  rooms,
  monsters
};

// -- /Constants --

// -- Game functions ------------------------------

function main() {
  state.character = 1;
  state.name = 'Frodo';
  nextLevel();
  render();
}

function attack() {
  state.message = '';

  let attackBonus = state.inventory.reduce((acc, val) => {
    if (val === Items.Amulet || val === Items.Sword) {
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

  const armorBonus = state.inventory.reduce((acc, val) => {
    if (val === Items.Armor) {
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
  }

  if (state.hp === 0) {
    state.message += ` You met your unfortunate demise.`;
  }

  render();
}

function goToRoom(roomNum) {
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
      rooms[state.room].status = RoomStatus.Clear;
    } else if (result === 2) {
      // trap
      state.activeTrap = true;
      state.message = 'It’s a trap! Roll to avoid.';
      state.playerCanMove = false;
    } else if (result === 6) {
      // new item
      let itemRoll = roll();

      if (itemRoll === 6) {
        itemRoll = roll();

        if (itemRoll > 3) {
          console.log('end game tbd');
          state.playerCanMove = false;
          return;
        }

        state.inventory.push(Items.Amulet);
        state.message = 'You found an amulet! +1 attack';
      }

      const item = Object.values(Items).filter((n) => n === itemRoll);
      state.inventory.push(item);
      state.message = `You found an item: ${itemsDisplay[item]}`;
      state.playerCanMove = true;
    } else {
      // monster
      state.activeMonster = { ...monsters[roll()] };

      // bonus if monster is in preferred room
      if (state.activeMonster.roomBonus === roomNum) {
        state.activeMonster.hp++;
      }

      state.message = `There is a ${state.activeMonster.name}!`;
      state.playerCanMove = false;
    }
  } else if (rooms[roomNum].status === RoomStatus.Clear) {
    state.message = 'This place looks familiar.';
  }

  render();
}

function nextLevel() {
  state.level++;
  state.room = 1;
  render();
}

function render() {
  console.log(state);

  renderControls();
  renderCharacter();
  renderMarker();

  document.querySelector('.message').innerHTML = state.message;
}

function rollAgainstTrap() {
  const result = roll();

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
  state.name = name;
  render();
}

// -- /Game functions --

// -- Render functions ----------------------------

function renderCharacter() {
  const characterHtml = squirrelly(characterTemplate);
  document.querySelector('.view-character').innerHTML = characterHtml;
}

function renderControls() {
  const controlsHtml = squirrelly(controlsTemplate);
  document.querySelector('.view-controls').innerHTML = controlsHtml;
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

// -- /Utils --

window.attack = attack;
window.goToRoom = goToRoom;
window.rollAgainstTrap = rollAgainstTrap;

main();
