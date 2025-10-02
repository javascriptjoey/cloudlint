import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Menu, CloudCog } from 'lucide-react'

export function Navbar() {
  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 relative z-30">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <CloudCog aria-hidden className="h-8 w-8 text-primary" />
          <Link to="/" className="font-semibold">Cloudlint</Link>
        </div>
        <nav className="hidden items-center gap-6 md:flex mr-6">
          <Link to="/playground" className="text-sm text-muted-foreground hover:text-foreground">Playground</Link>
          <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
        </nav>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Navigate to different pages of the application</SheetDescription>
              <div className="mt-8 grid gap-4">
                <SheetClose asChild>
                  <Link className="text-lg" to="/">Home</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link className="text-lg" to="/playground">Playground</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link className="text-lg" to="/contact">Contact</Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}