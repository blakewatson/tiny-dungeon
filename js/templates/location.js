export default `
  Location:
  {{ @if (level === 0) }}
    <strong>Tower exterior</strong>
  {{ #else }}
    <strong>Level {{ level }}</strong>
  {{ /if }}
`;
