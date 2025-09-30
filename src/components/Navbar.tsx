import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded bg-primary" aria-hidden />
          <Link to="/" className="font-semibold">Cloudlint</Link>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link>
          <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
          <div className="ml-2"><ModeToggle /></div>
        </nav>
        <div className="md:hidden flex items-center gap-2">
          <ModeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <div className="mt-8 grid gap-4">
                <SheetClose asChild>
                  <Link className="text-lg" to="/">Home</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link className="text-lg" to="/about">About</Link>
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