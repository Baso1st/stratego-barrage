// Shows which build is running, so you can tell at a glance what test and production have.
export default function AppVersion() {
  return <footer className="app-version">{__APP_VERSION__}</footer>
}
