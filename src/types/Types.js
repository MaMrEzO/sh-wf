import React from "react";

export class State {
	constructor(state, dispatcher) {
		this.state = state;
		this.dispatcher = dispatcher;
	}
}

class WorkflowItem {
	constructor(id, title, parentID, done, ref) {
		this.id = id;
		this.title = title;
		this.parentID = parentID;
		this.done = done;
		this.ref = ref;
	}

	clone() {
		return new WorkflowItem(
			this.id,
			this.title,
			this.parentID,
			this.done,
			this.ref,
		)
	}

	storeVersion() {
		return new WorkflowItem(
			this.id,
			this.title,
			this.parentID,
			this.done,
			null
		)
	}
}

function findIDIndex(list, id) {
	if (!Array.isArray(list))
		return -1;
	let res = -1;
	list.forEach((item, index) => {
		if (item.id === id)
			res = index;
	})
	return res;
}

class WorkflowData {
	constructor(data, focusedRef) {
		if (data !== null && data !== undefined && Array.isArray(data)) {
			this.data = data;
			this.makeTree();
		} else {
			this.data = [];
			this.tree = [];
			this._mappedWFs = new Map();
		}

		this.focusedRef = focusedRef;
	}

	get length() {
		return this.data.length;
	}

	setFocusedRef(ref) {
		let newWFData = this.clone();
		newWFData.focusedRef = ref;
		return newWFData;
	}

	newID() {
		let lastId = 0;
		this.data.forEach(item => lastId = item.id > lastId ? item.id : lastId);
		return lastId + 1;
	}

	validateID(id) {
		let validate = false;
		this.data.forEach(item => {
			if (item.id === id)
				validate = true;
		});
		return validate;
	}

	getLookingList(id) {
		let list;
		let idIndex = findIDIndex(this.data, id);
		if (idIndex >= 0 && idIndex < this.length) {
			let wfItem = this.data[idIndex];
			if (wfItem.parentID !== null) {
				list = this._mappedWFs.get(wfItem.parentID).children;
			} else {
				list = this.tree;
			}
		}
		return list;
	}

	getByID(id) {
		let idIndex = findIDIndex(this.data, id);
		if (idIndex >= 0 && idIndex < this.length)
			return this.data[idIndex];
		return null;
	}

	nextRef(id) {
		if (this.tree === null || this.tree === undefined) {
			console.log("nTREE is failed!");
		}
		let lookingList = this.getLookingList(id);
		let idIndex = findIDIndex(lookingList, id);
		let wfItem = this._mappedWFs.get(id);
		if (wfItem.children && wfItem.children.length > 0) {
			return wfItem.children[0].ref;
		} else if (idIndex < lookingList.length - 1) {
			return lookingList[idIndex + 1].ref;
		} else if (wfItem.parentID != null) {
			id = wfItem.parentID;
			let lookingList = this.getLookingList(id);
			let idIndex = findIDIndex(lookingList, id);
			if (idIndex < lookingList.length - 1) {
				return lookingList[idIndex + 1].ref;
			}
		}
		return null;
	}

	previousRef(id) {
		if (this.tree === null || this.tree === undefined) {
			console.log("nTREE is failed!");
		}
		let lookingList = this.getLookingList(id);
		let idIndex = findIDIndex(lookingList, id);
		let wfItem = this.getByID(id);
		if (idIndex === 0) {
			if (wfItem.parentID != null)
				return this.getByID(wfItem.parentID).ref;
			else
				return wfItem.ref;
		} else {
			let pwf = lookingList[idIndex - 1];
			while (this._mappedWFs.get(pwf.id).children) {
				let children = this._mappedWFs.get(pwf.id).children;
				pwf = children[children.length - 1];
			}
			return pwf.ref;
		}
	}

	previousID(id) {
		if (this.tree === null || this.tree === undefined) {
			console.log("nTREE is failed!");
		}
		let lookingList = this.getLookingList(id);
		let idIndex = findIDIndex(lookingList, id);
		let wfItem = this.getByID(id);
		if (idIndex === 0) {
			if (wfItem.parentID != null)
				return this.getByID(wfItem.parentID).id;
			else
				return wfItem.id;
		} else {
			let pwf = lookingList[idIndex - 1];
			return pwf.id;
		}
	}

	add(title, parentID, done, ref) {
		let newID = this.newID();
		if (this.length === 0 || parentID === null || parentID === undefined) {
			this.data.push(new WorkflowItem(newID, title, null, done, ref));
		} else {

			if (!this.validateID(parentID))
				return -1;

			this.data.push(new WorkflowItem(
				newID,
				title, parentID, done, ref
			));
		}
		this.tree = this.makeTree();
		return newID;
	}

	createUnderMyParent(id) {
		let myParentID;
		let newRef = React.createRef();
		if (id === null) {
			myParentID = null;
		} else {
			myParentID = this.getByID(id).parentID;
		}
		this.data.push(new WorkflowItem(
			this.newID(),
			"",
			myParentID,
			false,
			newRef
		));
		this.store();
		return this.setFocusedRef(newRef);
	}

	deleteByID(id) {
		let pWFRef = this.previousRef(id);
		//console.log("delete -> pref:", pWFRef);
		let newData = [];
		let ignoreList = [id];
		this.data.forEach(wfItem => {
			//Ignore the items with the id and items under it
			if (wfItem.parentID === id)
				ignoreList.push(wfItem.id);
			if (!ignoreList.includes(wfItem.id))
				newData.push(wfItem);
		});
		let newWFData = new WorkflowData(newData, pWFRef);
		newWFData.store();
		return newWFData;
	}

	clone() {
		return new WorkflowData(this.data.map(wfItem => wfItem), this.focusedRef);
	}

	store() {
		let storeData = this.data.map(wfItem => wfItem.storeVersion());
		localStorage.setItem('data', JSON.stringify(storeData));
	}

	restore() {
		let strData = localStorage.getItem('data');
		if (strData !== null && strData.length > 0) {
			let data = JSON.parse(strData);
			if (data !== null) {
				let newWFData = data.map(swfitem => new WorkflowItem(
					swfitem.id,
					swfitem.title,
					swfitem.parentID,
					swfitem.done,
					React.createRef()
				));
				this.data = newWFData;
				this.tree = this.makeTree();
				if (this.length > 0)
					this.focusedRef = this.data[0].ref;
			}
		}
	}

	setWFItemParent(id, newParent) {
		let idIndex = findIDIndex(this.data, id);

		if (idIndex >= 0 && idIndex < this.length) {
			this.data[idIndex].parentID = newParent;
			let newWFData = this.clone();
			newWFData.store();
			return newWFData;
		}
		return this;
	}

	setWFItemTitle(id, newTitle) {
		let idIndex = findIDIndex(this.data, id);

		if (idIndex >= 0 && idIndex < this.length) {
			this.data[idIndex].title = newTitle;
			let newWFData = this.clone();
			newWFData.store();
			return newWFData;
		}
		return this;
	}

	setWFItemDone(id, newDone) {
		let idIndex = findIDIndex(this.data, id);

		if (idIndex >= 0) {
			this.data[idIndex].done = newDone;
			let newWFData = this.clone();
			newWFData.store();
			return newWFData;
		}
		return this;
	}

	makeTree() {
		if (this.length === 0)
			return [];
		let base = this.data;
		let dataTree = [];
		const mappedWFItems = new Map();
		base.forEach(wfItem => mappedWFItems.set(wfItem.id, {...wfItem}));
		base.forEach(wfItem => {
			if (wfItem.parentID) {
				let mfwItem = mappedWFItems.get(wfItem.parentID);
				if (!mfwItem.children)
					mfwItem.children = [];
				mfwItem.children.push(mappedWFItems.get(wfItem.id));
			}
			else dataTree.push(mappedWFItems.get(wfItem.id));
		});
		this.tree = dataTree;
		this._mappedWFs = mappedWFItems;
		return dataTree;
	}
}

export {WorkflowItem, WorkflowData};
