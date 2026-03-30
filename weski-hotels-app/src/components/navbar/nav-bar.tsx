import React from "react";
import "./nav-bar.scss";
import WeSkiLogo from "../weski-logo/weski-logo";
import SearchForm from "../search-form/search-form";

const NavBar: React.FC = () => {
    return (
        <header className="nav-bar">
            <WeSkiLogo />
            <nav aria-label="Search navigation">
                <SearchForm />
            </nav>
        </header>
    );
}

export default NavBar;