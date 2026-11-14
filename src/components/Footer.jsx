export function Footer() {
    return (
        <footer className="border-t border-border">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between md:px-6">
                {/* TODO: підставити фінальний текст */}
                <p>SPHEREx sky explorer. Simulation for design review.</p>

                <nav aria-label="Footer" className="flex gap-6">
                    <a href="#how" className="transition-hover hover:text-text">How to explore</a>
                    <a href="#mission" className="transition-hover hover:text-text">The mission</a>
                    {/* Посилання «Design system» прибрано за ТЗ */}
                </nav>
            </div>
        </footer>
    );
}