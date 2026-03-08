export function ConfettiBurst() {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360 + Math.random() * 30 - 15;
    const distance = 40 + Math.random() * 30;
    const rad = (angle * Math.PI) / 180;
    const tx = Math.cos(rad) * distance;
    const ty = Math.sin(rad) * distance;
    const colors = [
      'hsl(var(--success))',
      'hsl(var(--warning))',
      'hsl(var(--primary))',
      'hsl(var(--accent))',
    ];
    return {
      tx,
      ty,
      color: colors[i % colors.length],
      size: 4 + Math.random() * 4,
      delay: Math.random() * 0.15,
      isSquare: i % 3 === 0,
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-10 flex items-center justify-center">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            borderRadius: p.isSquare ? '1px' : '50%',
            backgroundColor: p.color,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            animation: `confetti-burst 0.9s ease-out ${p.delay}s forwards`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
