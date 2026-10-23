// TODO: let the user track their progress on this issue. Cycle through
// "Not started" -> "Working on it" -> "PR opened" and remember the choice
// (localStorage is fine). Then remove the disabled attribute.
export default function TrackButton({ issue }) {
  return (
    <button className="btn" disabled title="Coming soon">
      Track progress
    </button>
  );
}
