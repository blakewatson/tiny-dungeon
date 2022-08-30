export default `
{{ @if (character) }}
<h1>{{ name }}</h1>
<p>{{ races[character].name }}</p>
<p>Hit points: {{ hp }}</p>
{{ /if }}
`;
