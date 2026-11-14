import { Orbit, Link2 } from "lucide-react";
import { Action } from "./Action.jsx";
import logo from "../assets/logo.svg";

export function Header() {
    return (
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 bg-header">
            <div className="flex items-center gap-3">
                <img src={logo} alt="Skypatch" className="h-10 w-auto" />
                <span className="font-heading text-2xl">Skypatch</span>
                <span className="hidden h-4 w-px bg-border sm:block" />
                <span className="hidden text-xs text-muted sm:block">Sky &amp; spectrum workspace</span>
            </div>

            <div className="flex items-center gap-3">
                <Action
                    icon={<Link2 size={16} />}
                    className="border-accent/40! bg-accent/10! hover:bg-accent/20!">
                    Share
                </Action>
            </div>
        </header>
    );
}