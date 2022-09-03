export default `
{{ @if (playerWon) }}
🤩
{{ #elif (hp === 3) }}
🙂
{{ #elif (hp === 2) }}
😐
{{ #elif (hp === 1) }}
🙁
{{ #elif (hp === 0) }}
😵
{{ /if }}
`;
