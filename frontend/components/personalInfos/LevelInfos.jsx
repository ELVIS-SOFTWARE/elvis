import React from "react";

import _ from "lodash";
import { optionMapper, hasKeys } from "../utils";

class LevelInfos extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            drafts: {},
        };
    }

    updateDraft(seasonId, field, value) {
        this.setState({
            drafts: {
                ...this.state.drafts,
                [seasonId]: {
                    ...(this.state.drafts[seasonId] || {
                        season_id: seasonId,
                        user_id: this.props.infos.id,
                    }),
                    [field]: value,
                },
            },
        });
    }

    render() {
        return (
            <div id="tab-2" className="tab-pane">
                <div className="form form-horizontal m-t-lg">
                    {_.map(
                        {
                            ..._.zipObject(
                                this.props.seasons.map(s => s.id),
                                _.times(this.props.seasons.length, Array)
                            ),
                            ..._.groupBy(this.props.infos.levels, "season_id"),
                        },
                        (levels, seasonId) => {
                            const season = this.props.seasons.find(
                                s => s.id == seasonId
                            );
                            return (
                                <div key={seasonId}>
                                    <h2>
                                        {season ? season.label : "Non précisée"}
                                    </h2>
                                    <div className="row">
                                        {levels.map((level, i) => (
                                            <div
                                                key={i}
                                                className="col-lg-2 col-md-4 col-sm-6"
                                            >
                                                <div
                                                    className={
                                                        "panel " +
                                                        (level.isNew
                                                            ? "panel-warning"
                                                            : "panel-primary")
                                                    }
                                                >
                                                    <div className="panel-heading flex flex-center-aligned flex-space-between-justified">
                                                        <h3>
                                                            {
                                                                _.get(_.find(this.props.activityRefs, ref => ref.id == level.activity_ref_id), "label") || ""
                                                            }
                                                        </h3>
                                                        <button
                                                            onClick={() =>
                                                                this.props.handleRemoveLevel(
                                                                    level.id
                                                                )
                                                            }
                                                            style={{
                                                                border: "none",
                                                                background:
                                                                    "transparent",
                                                            }}
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                    <div className="panel-body">
                                                        <div className="flex flex-center-aligned m-b-sm">
                                                            <h4 className="m-n m-r-sm">
                                                                Peut continuer
                                                            </h4>
                                                            <input
                                                                type="checkbox"
                                                                style={{
                                                                    marginLeft:
                                                                        "10px",
                                                                }}
                                                                name="can_continue"
                                                                checked={
                                                                    level.can_continue
                                                                }
                                                                onChange={e =>
                                                                    this.props.handleUpdateLevel(
                                                                        level.id,
                                                                        e.target
                                                                            .name,
                                                                        e.target
                                                                            .checked
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                        <select
                                                            className="form-control m-b"
                                                            name="evaluation_level_ref_id"
                                                            value={
                                                                level.evaluation_level_ref_id
                                                            }
                                                            onChange={e =>
                                                                this.props.handleUpdateLevel(
                                                                    level.id,
                                                                    e.target
                                                                        .name,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                        >
                                                            <option
                                                                disabled
                                                                value="0"
                                                            >
                                                                Choisir un
                                                                niveau
                                                            </option>
                                                            {_.chain(
                                                                this.props
                                                                    .evaluationLevels
                                                            )
                                                                .sortBy(
                                                                    "activity_ref_id"
                                                                )
                                                                .map(
                                                                    optionMapper()
                                                                )
                                                                .value()}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="col-lg-2 col-md-4 col-sm-6">
                                            <div className="panel panel-warning">
                                                <div className="panel-heading">
                                                    <select
                                                        className="form-control"
                                                        style={{
                                                            color: "black",
                                                        }}
                                                        name="activity_ref_id"
                                                        value={
                                                            _.get(
                                                                this.state
                                                                    .drafts[
                                                                    seasonId
                                                                ],
                                                                "activity_ref_id"
                                                            ) || ""
                                                        }
                                                        onChange={e =>
                                                            this.updateDraft(
                                                                seasonId,
                                                                e.target.name,
                                                                e.target.value
                                                            )
                                                        }
                                                    >
                                                        <option
                                                            value=""
                                                            disabled
                                                        >
                                                            ACTIVITÉ
                                                        </option>
                                                        {_(
                                                            this.props
                                                                .activityRefs
                                                        )
                                                            .sortBy("label")
                                                            .map(optionMapper())
                                                            .value()}
                                                    </select>
                                                </div>
                                                <div className="panel-body">
                                                    <div className="flex flex-center-aligned m-b-sm">
                                                        <h4 className="m-n m-r-sm">
                                                            Peut continuer
                                                        </h4>
                                                        <input
                                                            type="checkbox"
                                                            style={{
                                                                marginLeft:
                                                                    "10px",
                                                            }}
                                                            name="can_continue"
                                                            checked={_.get(
                                                                this.state
                                                                    .drafts[
                                                                    seasonId
                                                                ],
                                                                "can_continue"
                                                            )}
                                                            onChange={e =>
                                                                this.updateDraft(
                                                                    seasonId,
                                                                    e.target
                                                                        .name,
                                                                    e.target
                                                                        .checked
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="flex m-b">
                                                        <select
                                                            className="form-control m-r-xs"
                                                            name="evaluation_level_ref_id"
                                                            onChange={e =>
                                                                this.updateDraft(
                                                                    seasonId,
                                                                    e.target
                                                                        .name,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            value={
                                                                _.get(
                                                                    this.state
                                                                        .drafts[
                                                                        seasonId
                                                                    ],
                                                                    "evaluation_level_ref_id"
                                                                ) || ""
                                                            }
                                                        >
                                                            <option
                                                                disabled
                                                                value=""
                                                            >
                                                                NIVEAU
                                                            </option>
                                                            {_.chain(
                                                                this.props
                                                                    .evaluationLevels
                                                            )
                                                                .sortBy(
                                                                    "activity_ref_id"
                                                                )
                                                                .map(
                                                                    optionMapper()
                                                                )
                                                                .value()}
                                                        </select>
                                                        {
                                                            <button
                                                                className="btn btn-warning"
                                                                disabled={
                                                                    !hasKeys(
                                                                        this
                                                                            .state
                                                                            .drafts[
                                                                            seasonId
                                                                        ],
                                                                        [
                                                                            "activity_ref_id",
                                                                            "season_id",
                                                                            "evaluation_level_ref_id",
                                                                            "user_id",
                                                                        ]
                                                                    )
                                                                }
                                                                onClick={() => {
                                                                    this.setState(
                                                                        {
                                                                            drafts: {
                                                                                ...this
                                                                                    .state
                                                                                    .drafts,
                                                                                [seasonId]: null,
                                                                            },
                                                                        }
                                                                    );
                                                                    this.props.handleNewLevel(
                                                                        this
                                                                            .state
                                                                            .drafts[
                                                                            seasonId
                                                                        ]
                                                                    );
                                                                }}
                                                            >
                                                                <i className="fas fa-check"></i>
                                                            </button>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                    )}
                    <div className="form-group">
                        <button
                            className="btn btn-primary pull-right m-r-sm"
                            onClick={() => this.props.handleSaveInfos()}
                        >
                            Confirmer
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default LevelInfos;
