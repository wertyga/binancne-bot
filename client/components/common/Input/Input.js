import './Input.sass';

export default class Input extends React.Component {

    componentDidUpdate(prevProps) {
        if((this.props.hidden !== prevProps.hidden) && !this.props.hidden) {
            this.input.focus();

            this.input.addEventListener('keyup', this.confirmChanging);
            document.body.addEventListener('click', this.confirmChanging);
        };
    };

    confirmChanging = e => {
        if(!e.keyCode) {
            if(e.target.getAttribute('name') === this.input.getAttribute('name')) {
                return;
            };
            this.props.confirmChanging(this.props.name);
            document.body.removeEventListener('click', this.confirmChanging);
        } else {
            if(e.keyCode === 13) {
                this.props.confirmChanging(this.props.name);
            } else if(e.keyCode === 27){
                this.props.cancelInputing(this.props.name);
            };
            document.body.removeEventListener('click', this.confirmChanging);
        }

    };

    render() {

        const input = (
            <input
                ref={node => this.input = node}
                style={{
                    display: this.props.hidden ? 'none' : 'inline-block',
                    ...this.props.styleInput
                }}
                className="inner-input custom-input"
                type={this.props.type || "text"}
                placeholder={this.props.placeholder || '...'}
                value={this.props.value}
                name={this.props.name}
                disabled={this.props.disabled}
                onChange={this.props.onChange}
            />
        );
        const textarea = (
            <textarea
                onKeyDown={this.confirmChanging}
                ref={node => this.input = node}
                style={{
                    display: this.props.hidden ? 'none' : 'inline-block',
                    ...this.props.styleInput
                }}
                className="inner-input custom-input"
                type={this.props.type || "text"}
                placeholder={this.props.placeholder || '...'}
                value={this.props.value}
                name={this.props.name}
                disabled={this.props.disabled}
                onChange={this.props.onChange}
            />
        );

        return (
            <div className="Input"
                 onClick={() => this.props.onClick(this.props.name)}
                 name={this.props.name}
                 style={this.props.style}
            >
                <div className="label"><strong>{this.props.label}</strong></div>
                <div className="field"
                     style={{
                         display: !this.props.hidden ? 'none' : 'block',
                         ...this.props.styleField
                     }}>
                    {this.props.fixedValue || 'Пусто'}
                </div>
                {this.props.textarea ? textarea : input}
            </div>
        );
    };
};

Input.propTypes = {
    type: PropTypes.string, //Input type
    value: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]).isRequired, //initial input-value
    name: PropTypes.string.isRequired, //Input name
    placeholder: PropTypes.string, // placeholder value
    label: PropTypes.string, //Id and label value
    hidden: PropTypes.bool, //Show or hide input to edit field
    disabled: PropTypes.bool, //Disabled input
    textarea: PropTypes.bool, //Type of input: textarea or simple input
    onChange: PropTypes.func.isRequired, //onChange function,
    onClick: PropTypes.func.isRequired, //Function to chenge between plain field and input
    confirmChanging: PropTypes.func.isRequired, //Function to confirm changing
    fixedValue: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]).isRequired, //Value confirmed field
    cancelInputing: PropTypes.func.isRequired, //Cancel changing field
};