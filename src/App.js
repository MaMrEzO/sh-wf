import React from 'react';
import './App.css';
import AddButton from './components/AddButton';
import {WorkFlowBox} from './components/WorkFlow';
import {WorkflowData, State} from './types/Types';

var sample_store = new WorkflowData();

sample_store.add("To do", null, false, React.createRef());
sample_store.add("Make project", 1, false, React.createRef());
sample_store.add("Make repo on git", 1, true, React.createRef());
sample_store.add("Init git", 3, false, React.createRef());


//console.log("Tree", sample_store, sample_store.tree);

function App() {
	const [store, setStore] = React.useState(sample_store);
	const state = new State(store, setStore);

	const tree = store.makeTree();
	//console.log("tree: ", store, tree);

	return (
		<div className="App">
			<div key="AppTitle" className="AppTitle">Workflow</div>
			<WorkFlowBox key="wfMasterBox" data={tree} state={state} />
			<AddButton key="AddButton" onClick={() => {alert("Adding...")}} />
		</div>
	);
}

export default App;
