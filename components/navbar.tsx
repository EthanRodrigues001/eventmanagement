import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-semibold">
            NS
          </Link>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="#" className="text-sm hover:text-foreground/80">
            Features
          </Link>
          <Link href="#" className="text-sm hover:text-foreground/80">
            Pricing
          </Link>
          <Link href="#" className="text-sm hover:text-foreground/80">
            Documentation
          </Link>
          <Link href="#" className="text-sm hover:text-foreground/80">
            Blog
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="#" className="text-sm">
              Sign In
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="#" className="text-sm">
              Get Started
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
