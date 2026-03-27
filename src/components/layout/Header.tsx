export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top">
      <div className="flex h-14 items-center justify-center gap-2 px-4">
        <img 
          src="/icon-192.png" 
          alt="Paws Play Repeat" 
          className="h-9 w-9 rounded-xl"
        />
        <span className="text-lg font-bold text-foreground">Paws Play Repeat</span>
      </div>
    </header>
  );
}
