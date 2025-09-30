export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t py-6 mt-12">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        Cloudlint © {year}
      </div>
    </footer>
  )
}
