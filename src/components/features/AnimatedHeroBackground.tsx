import { useEffect, useRef } from "react";

interface Flashcard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  width: number;
  height: number;
  opacity: number;
  type: "question" | "answer" | "brain" | "lightbulb";
  color: string;
  scale: number;
}

const AnimatedHeroBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const flashcardsRef = useRef<Flashcard[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Create flashcards
    const createFlashcards = () => {
      const flashcards: Flashcard[] = [];
      const cardCount = Math.min(25, Math.floor((canvas.width * canvas.height) / 30000));

      const cardTypes: Flashcard["type"][] = ["question", "answer", "brain", "lightbulb"];
      const colors = ["#3B82F6", "#8B5CF6", "#6366F1", "#A855F7"];

      for (let i = 0; i < cardCount; i++) {
        flashcards.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          width: 60 + Math.random() * 40,
          height: 40 + Math.random() * 30,
          opacity: 0.15 + Math.random() * 0.25,
          type: cardTypes[Math.floor(Math.random() * cardTypes.length)],
          color: colors[Math.floor(Math.random() * colors.length)],
          scale: 0.8 + Math.random() * 0.4,
        });
      }
      return flashcards;
    };

    flashcardsRef.current = createFlashcards();

    // Mouse interaction handled in JSX overlay

    // Draw flashcard content
    const drawFlashcardContent = (ctx: CanvasRenderingContext2D, card: Flashcard, centerX: number, centerY: number) => {
      ctx.save();
      ctx.fillStyle = card.color;
      ctx.font = `${12 * card.scale}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      switch (card.type) {
        case "question":
          ctx.fillText("?", centerX, centerY);
          break;
        case "answer":
          ctx.fillText("A", centerX, centerY);
          break;
        case "brain":
          // Simple brain icon
          ctx.beginPath();
          ctx.arc(centerX - 8, centerY - 5, 4, 0, Math.PI * 2);
          ctx.arc(centerX + 8, centerY - 5, 4, 0, Math.PI * 2);
          ctx.arc(centerX, centerY + 2, 6, 0, Math.PI);
          ctx.fill();
          break;
        case "lightbulb":
          // Simple lightbulb
          ctx.beginPath();
          ctx.arc(centerX, centerY - 2, 3, 0, Math.PI * 2);
          ctx.rect(centerX - 1, centerY - 2, 2, 6);
          ctx.fill();
          break;
      }
      ctx.restore();
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);


      flashcardsRef.current.forEach((card) => {
        // Update position
        card.x += card.vx;
        card.y += card.vy;
        card.rotation += card.rotationSpeed;

        // Boundary check with bounce
        if (card.x < 0 || card.x > canvas.width) {
          card.vx *= -0.7;
          card.x = Math.max(0, Math.min(canvas.width, card.x));
        }
        if (card.y < 0 || card.y > canvas.height) {
          card.vy *= -0.7;
          card.y = Math.max(0, Math.min(canvas.height, card.y));
        }

        // Draw flashcard
        ctx.save();
        ctx.globalAlpha = card.opacity;

        const currentScale = card.scale;
        const currentColor = card.color;

        ctx.translate(card.x, card.y);
        ctx.rotate(card.rotation);
        ctx.scale(currentScale, currentScale);

        // Draw card shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(-card.width / 2 + 2, -card.height / 2 + 2, card.width, card.height);

        // Draw card background
        const cardGradient = ctx.createLinearGradient(
          -card.width / 2,
          -card.height / 2,
          card.width / 2,
          card.height / 2
        );
        cardGradient.addColorStop(0, currentColor);
        cardGradient.addColorStop(1, `${currentColor}dd`);
        ctx.fillStyle = cardGradient;
        ctx.fillRect(-card.width / 2, -card.height / 2, card.width, card.height);

        // Draw card content
        drawFlashcardContent(ctx, card, 0, 0);

        ctx.restore();

        // Apply friction
        card.vx *= 0.995;
        card.vy *= 0.995;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: "multiply" }}
    />
  );
};

export default AnimatedHeroBackground;
