export default `
{{ @if (character) }}
  {{! let [ monster1, monster2 ] = races[character].bonusAgainst }}

  <h2 class="mb-none">{{ name }}</h2>

  <p class="mb-none">
    {{ races[character].name }} (+1 vs. 
    {{ monsters[monster1].name }} & {{ monsters[monster2].name }})
  </p>

  <p class="mt-none">Hit points: <strong>{{ hp }}</strong></p>

  <h3 class="mb-none">Inventory</h3>

  <ul class="mt-none">
    <li>Gold: {{ gold }}</li>
    
    {{ @each (Object.keys(inventory)) => key, idx }}
      <li>{{ itemsDisplay[key] }}: {{ inventory[key] }}</li>
    {{ /each }}
  </ul>

  <hr>
{{ /if }}
`;
