
import { useRef, useEffect } from "react";

const Particles = ({
    particleCount = 100,
    particleColor = "#ffffff",
    size = 2,
    speed = 0.5,
}) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let particles = [];
        let animationFrameId;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    dx: (Math.random() - 0.5) * speed,
                    dy: (Math.random() - 0.5) * speed,
                    size: Math.random() * size + 0.5,
                });
            }
        };

        const drawParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = particleColor;
            ctx.beginPath();
            particles.forEach((p) => {
                ctx.moveTo(p.x, p.y);
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

                p.x += p.dx;
                p.y += p.dy;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
            });
            ctx.fill();
            animationFrameId = requestAnimationFrame(drawParticles);
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
        createParticles();
        drawParticles();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [particleCount, particleColor, size, speed]);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

export default Particles;
