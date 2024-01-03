import React from "react";
import _ from "lodash";
import { csrfToken } from "./utils";

class Omnisearch extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isSearchOpen: false,
            inputSearch: "",
            isLoading: false,
            results: [],
        };
    }

    openSearch() {
        this.setState({ isSearchOpen: true }, () => {
            this.searchInput.focus();
        });
    }

    closeSearch() {
        this.setState({
            isSearchOpen: false,
            inputSearch: "",
            results: [],
        });
    }

    handleSearch(e) {
        const searchValue = e.target.value;

        this.setState({ inputSearch: searchValue, isLoading: true }, () => {
            return fetch("/omnisearch", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    search_value: searchValue,
                }),
            })
                .then(response => response.json())
                .then(data => {
                    return this.setState({
                        results: data.results,
                        total: data.total,
                        isLoading: false,
                    });
                });
        });
    }

    render() {
        if (this.state.isSearchOpen) {
            this.searchInput.focus();
        }

        return (
            <div>
                <div
                    className={`navbar-form-custom school-omnisearch ${this.state.isSearchOpen ? "btn--hidden" : ""
                        }`}
                    onClick={() => this.openSearch()}>
                    <i className="fas fa-search search-icon" />
                    <input
                        type="text"
                        placeholder="Rechercher"
                        className="form-control"
                    />
                </div>

                <div
                    className={`omnisearch ${this.state.isSearchOpen ? "open" : ""
                        }`}
                >
                    <main
                        className={`main-wrap ${this.state.isSearchOpen ? "main-wrap--overlay" : ""
                            }`}
                    >
                        <button
                            id="btn-search-close"
                            className={`btn btn--search-close ${this.state.isSearchOpen ? "" : "btn--hidden"
                                }`}
                            aria-label="Close search form"
                            onClick={() => this.closeSearch()}
                        >
                            <i className="fas fa-times" />
                        </button>
                        <div
                            className={`search ${this.state.isSearchOpen ? "search--open" : ""
                                }`}
                        >
                            <div className="search__inner">
                                <form className="search__form" action="">
                                    <input
                                        className="search__input"
                                        name="search"
                                        type="search"
                                        placeholder="Recherche"
                                        autoFocus={true}
                                        ref={input =>
                                            (this.searchInput = input)
                                        }
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                        spellCheck="false"
                                        value={this.state.inputSearch}
                                        onChange={e => this.handleSearch(e)}
                                    />
                                </form>

                                {this.state.inputSearch ? (
                                    <h3>{`${this.state.total ||
                                        0} Trouvé.e.s au total`}</h3>
                                ) : null}

                                <ul className="search__results">
                                    {_.map(this.state.results, (o, i) => {
                                        switch (o.attributes.kind) {
                                            case "user":
                                                return (
                                                    <UserResult
                                                        key={i}
                                                        infos={o}
                                                    />
                                                );
                                            case "activityapplication":
                                                return (
                                                    <ActivityApplicationResult
                                                        key={i}
                                                        infos={o}
                                                    />
                                                );
                                            case "adhesion":
                                                return (
                                                    <AdhesionResult
                                                        key={i}
                                                        infos={o}
                                                    />
                                                );
                                            case "activityref": return <ActivityResult key={i} infos={o} />
                                            case "room": return <RoomResult key={i} infos={o} />
                                        }
                                    })}
                                </ul>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }
}

const UserResult = ({ infos }) => {
    return (
        <li>
            <small>Utilisateur</small>
            <a href={`/users/${infos.attributes.user_id}`}>
                {`${infos.attributes.user_adherent_number}: ${infos.attributes.user_first_name
                    } ${infos.attributes.user_last_name}`}
            </a>
        </li>
    );
};

const ActivityResult = ({ infos }) => {
    return <li>
        <small>Activitée</small>
        <a href={`/activity_ref/${infos.attributes.activity_id}/edit`}>
            {
                `${infos.attributes.activity_name}`
            }
        </a>
    </li>
};

const ActivityApplicationResult = ({ infos }) => {
    return (
        <li>
            <a href={`/inscriptions/${infos.attributes.application_id}`}>
                <small>Demande d'inscription</small>
                {`${infos.attributes.application_id}: ${infos.attributes.application_first_name
                    } ${infos.attributes.application_last_name}`}
                <p>{infos.attributes.application_status}</p>
            </a>
        </li>
    );
};

const AdhesionResult = ({ infos }) => {
    return (
        <li>
            <a
                href={`/users/${infos.attributes.adhesion_user_id
                    }/adherent_card`}
            >
                <small>Adhésion</small>
                {`${infos.attributes.adhesion_adherent_number}: ${infos.attributes.adhesion_first_name
                    } ${infos.attributes.adhesion_last_name}`}
            </a>
        </li>
    );
};

const RoomResult = ({ infos }) => {
    return (
        <li>
            <a
                href={`/rooms/${infos.attributes.room_id
                    }/edit`}
            >
                <small>{infos.attributes.is_practice_room ? "Practice r" : "R"}oom</small>
                {`${infos.attributes.room_name} (floor: ${infos.attributes.room_floor})`}
            </a>
        </li>
    );
};

export default Omnisearch;
