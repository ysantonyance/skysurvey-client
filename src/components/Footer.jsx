import logo from "../assets/logo.svg";

export function Footer() {
    return (
        <footer className="border-t border-border bg-surface px-4 py-3">
            <div className="flex flex-col gap-3 text-xs text-muted md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="" className="h-6 w-auto" />
                    <span className="font-heading text-base text-text">Skypatch</span>
                    <span className="hidden h-4 w-px bg-border sm:block" />
                    <span className="hidden sm:block">Infrared sky explorer</span>
                </div>

                <p className="max-w-2xl md:text-right">
                    Built on real NASA data: SPHEREx images and spectra via the NASA/IPAC
                    Infrared Science Archive (IRSA). Catalog cross-matches use Gaia DR3 (ESA)
                    and NASA's WISE/CatWISE. Processing and display here are simplified
                    for demonstration. This project is not affiliated with or endorsed by NASA.
                </p>
            </div>
        </footer>
    );
}