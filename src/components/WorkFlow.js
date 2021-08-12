import React from 'react';
import {useEffect} from 'react';
import './WorkFlow.css';

export function WorkFlowBox(props) {
	const {state} = props;
	return (
		<div className="workflow-box" key={""}>
			{props.data.map(wfItem => {
				if (wfItem.children && wfItem.children.length > 0) {
					return (
						<React.Fragment key={"wfFragment" + wfItem.id}>
							<WorkFlowRow key={"wfRow" + wfItem.id} item={wfItem} state={state} />
							<WorkFlowBox key={"wfBox" + wfItem.id} data={wfItem.children} state={state} />
						</React.Fragment>
					)
				} else {
					return <WorkFlowRow key={"wfRow" + wfItem.id} item={wfItem} state={state} />
				}
			})}
		</div>
	)
}

export function WorkFlowRow(props) {
	const {item, state} = props;

	const keyDowHandler = (e) => {
		let handled = false;
		let el_ref;
		//element id <=> WF_ID
		let id = Number.parseInt(e.target.id);
		let wfItem = state.state.getByID(id);
		switch (e.keyCode) {
			case 8://BackSpace
				if (item.title === "")
					state.dispatcher(state.state.deleteByID(id));
				break;
			case 9://Tab
				if (e.shiftKey) {
					if (wfItem.parentID !== null) {
						let pwf = state.state.getByID(wfItem.parentID);
						state.dispatcher(state.state.setWFItemParent(id, pwf.parentID));
					}
				} else {
					let pwfID = state.state.previousID(id);
					let pwf = state.state.getByID(pwfID);
					if (pwfID !== null) {
						//this and pwf have different parents
						if (pwf.parentID !== wfItem.parentID && wfItem.parentID !== pwf.id)
							state.dispatcher(state.state.setWFItemParent(id, pwf.parentID));
						//this and pwf have same parent
						else if (pwf.parentID === wfItem.parentID)
							state.dispatcher(state.state.setWFItemParent(id, pwf.id));
					} else {
						//console.info("pwfID is null!");
					}
				}
				handled = true;
				//console.log("Try focus this e");
				//e.target.focus();
				break;
			case 13:
				if (e.ctrlKey) {
					let wfItem = state.state.getByID(id);
					state.dispatcher(state.state.setWFItemDone(id, !wfItem.done));
				} else {
					state.dispatcher(state.state.createUnderMyParent(props.item.id));
				}
				break;
			case 38://ArrowUp
				el_ref = state.state.previousRef(id);
				if (el_ref !== null) {
					//el_ref.current.focus()
					state.dispatcher(state.state.setFocusedRef(el_ref));
					handled = true;
				}
				break;
			case 40://Arrow
				el_ref = state.state.nextRef(id);
				if (el_ref !== null) {
					//el_ref.current.focus()
					state.dispatcher(state.state.setFocusedRef(el_ref));
					handled = true;
				}
				break;
			case 46://Delete
				if (e.shiftKey && e.ctrlKey) {
					state.dispatcher(state.state.deleteByID(id));
					handled = true;
				}
				break;
			default:
			//console.log("Unhandled: ", e.keyCode)
		}
		if (handled) {
			e.preventDefault();
			e.stopPropagation();
		}
	}

	const onChange = e => {
		let id = Number.parseInt(e.target.id);
		state.dispatcher(state.state.setWFItemTitle(id, e.target.value));
	}



	useEffect(() => {
		if (state.state.focusedRef === props.item.ref && document.activeElement !== props.item.ref.current) {
			//console.log("FOCUS", document.activeElement.id, " != ", props.item.ref.current.id);
			props.item.ref.current.focus();
		} else {
			//console.log("fcr", state.state.focusedRef, item.ref);
		}
	});

	const onFocus = e => {
		//console.log("Foucus of me:", e);
		////if(e.nativeEvent.srcElement === e.nativeEvent.target){
		//console.info("Wa catch it", e.nativeEvent.srcElement.id, e.nativeEvent.target.id);
		////}
		state.dispatcher(state.state.setFocusedRef(item.ref));
	}

	return (
		<div className="workflow-row" key={"wfRowContainer" + item.id}>
			<input
				className={item.done ? " done" : ""}
				key={item.id}
				id={item.id}
				ref={item.ref}
				onKeyDown={(e) => keyDowHandler(e)}
				value={item.title}
				onChange={(e) => onChange(e)}
				onFocus={e => onFocus(e)}
				autoComplete="off"
			/>
		</div>
	)
}
