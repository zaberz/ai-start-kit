import { Link } from '@tanstack/react-router'
import { Shirt } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary">
              <Shirt className="size-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">LaFibre</span>
          </Link>

          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              to="/"
              className="transition-colors hover:text-foreground"
            >
              首页
            </Link>
            <Link
              to="/about"
              className="transition-colors hover:text-foreground"
            >
              关于
            </Link>
            <Link
              to="/ficus/dashboard"
              className="transition-colors hover:text-foreground"
            >
              管理后台
            </Link>
          </nav>

          <p className="text-sm text-muted-foreground">
            &copy; {year} LaFibre
          </p>
        </div>
      </div>
    </footer>
  )
}
