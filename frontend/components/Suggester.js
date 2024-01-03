import React from "react";
import PropTypes from "prop-types";

import Autosuggest from "react-autosuggest";

const renderSuggestion = s => <div>{s.name}</div>;

class Suggester extends React.Component {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);

        this.state = {
            value: this.props.value || "",
            suggestions: [],
        };
    }

    getSuggestions(value) {
        const inputValue = value.trim().toLowerCase();
        const inputLength = inputValue.length;

        return inputLength === 0
            ? []
            : this.props.values.filter(
                  lang =>
                      lang.name.toLowerCase().slice(0, inputLength) ===
                      inputValue,
              );
    }

    getSuggestionValue(s) {
        return s.name;
    }

    onChange(event, { newValue }) {
        this.setState({
            value: newValue,
        });
        this.props.onValueChange(newValue);
    }

    onSuggestionsFetchRequested({ value }) {
        this.setState({
            suggestions: this.getSuggestions(value),
        });
    }

    onSuggestionsClearRequested() {
        this.setState({
            suggestions: [],
        });
    }

    render() {
        const { value, suggestions } = this.state;

        const inputProps = {
            placeholder: this.props.placeholder,
            value,
            onChange: this.onChange,
        };

        return (
            <Autosuggest
                id="cities"
                suggestions={suggestions}
                onSuggestionsFetchRequested={value =>
                    this.onSuggestionsFetchRequested(value)
                }
                onSuggestionsClearRequested={() =>
                    this.onSuggestionsClearRequested()
                }
                onSuggestionSelected={(
                    event,
                    {
                        suggestion,
                        suggestionValue,
                        suggestionIndex,
                        sectionIndex,
                        method,
                    },
                ) => this.props.onSelection(suggestionValue)}
                getSuggestionValue={s => this.getSuggestionValue(s)}
                renderSuggestion={renderSuggestion}
                inputProps={inputProps}
                theme={{
                    input: "form-control",
                    suggestionsContainer: "suggester-results",
                    suggestionsList: "suggester-results__options",
                    suggestion: "suggester-results__option",
                    suggestionHighlighted:
                        "suggester-results__option--highlighted",
                }}
            />
        );
    }
}

export default Suggester;
