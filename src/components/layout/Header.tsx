import pawsplayLogo from "@/assets/pawsplay-logo.png";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-center px-4">
        <img 
          src={pawsplayLogo} 
          alt="PawsPlay - Paws Play Repeat" 
          className="h-10 w-auto"
        />
      </div>
    </header>
  );
}
