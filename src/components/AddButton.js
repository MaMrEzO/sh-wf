import './AddButton.css';

export default function AddButton(props) {
	return (
		<button className="AddButton" onClick={props.onClick}><div className="AddButtonTitle">Add Item</div></button>
	)
}

