import React, { Fragment } from "react";
import { KINDS_LABEL } from "../../tools/constants";

const KindLegend = ({ kinds }) => (
    <Fragment>
        {kinds.map(k => (
            <div className="kind-inline" key={k}>
                <span className={`dot bg-kind-${k}`} />
                {KINDS_LABEL[k]}
            </div>
        ))}
    </Fragment>
);

export default KindLegend;
