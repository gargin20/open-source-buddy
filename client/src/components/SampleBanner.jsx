export default function SampleBanner() {
  return (
    <div className="banner" role="status">
      <strong>Sample data</strong> — these issues and repos are made up for demos. Set
      <code> GITHUB_MODE=live </code> in <code>.env</code> to see real GitHub data.
    </div>
  );
}
