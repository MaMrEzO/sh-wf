import React from "react";

export class State {
	constructor(state, dispatcher) {
		this.state = state;
		this.dispatcher = dispatcher;
	}
}

class WorkflowItem {
	/**
	 * @constructor
	 * Construct a new instance of WorkflowItem
	 */
	constructor(id, title, parentID, order, done, ref) {
		this.id = id;
		this.title = title;
		this.parentID = parentID;
		this.order = order;
		this.done = done;
		this.ref = ref;
	}

	/**
	 * Make a deep clone of WorkflowItem
	 */
	clone() {
		return new WorkflowItem(
			this.id,
			this.title,
			this.parentID,
			this.order,
			this.done,
			this.ref,
		)
	}

	/**
	 * Make a clone of WorkflowItem without ref
	 */
	storeVersion() {
		return new WorkflowItem(
			this.id,
			this.title,
			this.parentID,
			this.order,
			this.done,
			null
		)
	}
}

/**
 * Find an item in provided list(Arra of WorkflowItem) with id an return index of item in list
 * 
 * @param {Array} list Array of WorkflowItem
 * @param {number} id ID of WorkflowItem to find
 */
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

function sortChildren(children) {
	children.forEach(cwfItem => {
		if(cwfItem.children && cwfItem.children.length)
			cwfItem.children = sortChildren(cwfItem.children)
	});
	return children.sort((l, r) => l.order - r.order);
}

/**
 * WorkflowData
 * The main class for manipulating workflows
 *
 * To instance a naw and empty WorkflowData just call new WorkflowData(),
 *
 * @constructor
 * @param {WorkflowItem[]} data - List data of WorkflowItem's for new WorkflowData instance
 * @param {React.RefObject<any>} focusedRef - Focused ref in app, ignore it if none
 *
 */
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

	/**
	 * length, return this.data.lenght
	 */
	get length() {
		return this.data.length;
	}

	/**
	 * setFocusedRef
	 * This is useful when this WorkflowData used in state manner, 
	 * For updateState in react this will clone object and set ref to cloned one.
	 * @param {React.RefObject<any>} ref - ref of component that will recive focus.
	 */
	setFocusedRef(ref) {
		let newWFData = this.clone();
		newWFData.focusedRef = ref;
		return newWFData;
	}

	/**
	 * Creating and adding WorkflowItem to list need a unique ID,
	 * newID make a new ID base on bigger id in the list + 1
	 */
	newID() {
		let lastId = 0;
		this.data.forEach(item => lastId = item.id > lastId ? item.id : lastId);
		return lastId + 1;
	}

	/**
	 * _validateID, private method, make sure id is valid in the list!
	 * @param {number} id - An id to test 
	 */
	_validateID(id) {
		let validate = false;
		this.data.forEach(item => {
			if (item.id === id)
				validate = true;
		});
		return validate;
	}

	/**
	 * getLookingList, make a list of WorkflowItem's base on wfItem in tree.
	 *
	 * @param {number} id An id of WorkflowItem 
	 * @returns {Array} Array of WorkflowItem
	 */
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

	/**
	 * Return a WorkflowItem if id is valid, otherwise returns null.
	 *
	 * @param {number} id An id of WorkflowItem 
	 * @returns {WorkflowItem} founded WorkflowItem or null if id is invalid
	 */
	getByID(id) {
		let idIndex = findIDIndex(this.data, id);
		if (idIndex >= 0 && idIndex < this.length)
			return this.data[idIndex];
		return null;
	}

	/**
	 * Find and return a React.RefObject forward, 
	 * This help UI to determine next element to focus!
	 *
	 * @param {number} id Current WorkflowItem id
	 * @returns {WorkflowItem} Next WorkflowItem.ref
	 */
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

	/**
	 * Find and return a React.RefObject backward, 
	 * This help UI to determine pervious element to focus!
	 *
	 * @param {number} id Current WorkflowItem id
	 * @returns {WorkflowItem} Pervious WorkflowItem.ref
	 */
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

	/**
	 * Find and return a WorkflowItem.id backward, 
	 * To change indent of current WorkflowItem this id is needed!
	 *
	 * @param {number} id Current WorkflowItem id
	 * @returns {number} Pervious WorkflowItem.id
	 */
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

	/**
	 * add new WorkflowItem to the list,
	 * THIS METHOD DO NOTHING IF YOU WANT MAKE STATECHANGE
	 * it just add an item to list, if stateChange is the matter use createUnderMyParent
	 *
	 * @param {string} title title of WorkflowItem
	 * @param {number} parentID parentID of WorkflowItem, pass null to insert new item in root
	 * @param {boolean} done pass true if WorkflowItem is done
	 * @param {React.RefObject<any>} ref ref Element of WorkflowItem
	 */
	add(title, parentID, done, ref) {
		let newID = this.newID();
		if (this.length === 0 || parentID === null || parentID === undefined) {
			this.data.push(new WorkflowItem(newID, title, null, null, done, ref));
		} else {

			if (!this._validateID(parentID))
				return -1;

			let parentChildren = this.data.filter(wfItem => wfItem.parentID === parentID);
			
			this.data.push(new WorkflowItem(
				newID,
				title, parentID, parentChildren.length, done, ref
			));
		}
		this.tree = this.makeTree();
		return newID;
	}

	/**
	 * Create a new WorkflowItem in the end of Parent.children and clone this instance
	 * for stateChange!
	 * @param {number} id parentID of current WorkflowItem.
	 */
	createUnderMyParent(id) {
		let myParentID;
		let myOrder;
		let newRef = React.createRef();
		if (id === null) {
			myParentID = null;
		} else {
			let me = this.getByID(id);
			myParentID = me.parentID;
			myOrder = me.order;
			this.data.forEach(wfItem => {
				if(wfItem.parentID === myParentID && wfItem.order > myOrder){
					wfItem.order = wfItem.order + 1;
				}
			})
		}
		this.data.push(new WorkflowItem(
			this.newID(),
			"",
			myParentID,
			myOrder + 1,
			false,
			newRef
		));
		this.store();
		return this.setFocusedRef(newRef);
	}

	/**
	 * Delete WorkflowItem by its id, child nodes will deleted!
	 *
	 * @param {number} id id of WorkflowItem to be deleted
	 */
	deleteByID(id) {
		let pWFRef = this.previousRef(id);
		let newData = [];
		let ignoreList = [id];
		this.data.forEach(wfItem => {
			//Ignore the items with the id and items under it
			if (ignoreList.includes(wfItem.parentID))
				ignoreList.push(wfItem.id);

			if (!ignoreList.includes(wfItem.id))
				newData.push(wfItem);
		});
		let newWFData = new WorkflowData(newData, pWFRef);
		newWFData.store();
		return newWFData;
	}

	/**
	 * Clone this WorkflowData instance to trigger stateChange!
	 * @returns {WorkflowData} cloned WorkflowData
	 */
	clone() {
		return new WorkflowData(this.data.map(wfItem => wfItem), this.focusedRef);
	}

	/**
	 * Store the list to localStorage, do not call this method directly, 
	 * this method triggers automaticall as needed
	 */
	store() {
		let storeData = this.data.map(wfItem => wfItem.storeVersion());
		localStorage.setItem('data', JSON.stringify(storeData));
	}

	/**
	 * Restore the list from localStorage, method must calls directly, 
	 * CALL IT BEFORE PASS THE WorkflowData TO useState OR SET IT TO State
	 * this method will not trigger stateChange!
	 * 
	 * This will need to call in initiate of Application once and no more!
	 */
	restore() {
		let strData = localStorage.getItem('data');
		if (strData !== null && strData.length > 0) {
			let data = JSON.parse(strData);
			if (data !== null) {
				let newWFData = data.map(swfitem => new WorkflowItem(
					swfitem.id,
					swfitem.title,
					swfitem.parentID,
					swfitem.order,
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

	/**
	 * Set one of WorkflowItem's parent by its id, 
	 * This will also clone the list to trigger stateChange!
	 *
	 * If id is invalid the current list will be returns.
	 */
	setWFItemParent(id, newParent) {
		let idIndex = findIDIndex(this.data, id);

		if (idIndex >= 0 && idIndex < this.length) {
			let parentChildren = this.data.filter(wfItem => wfItem.parentID === newParent);
			let newOrder = 0;
			if(parentChildren.length > 0)
				parentChildren.forEach(cwfItem => {
					if(cwfItem.order > newOrder)
						newOrder = cwfItem.order + 1;
				});
			this.data[idIndex].parentID = newParent;
			this.data[idIndex].order = newOrder;
			let newWFData = this.clone();
			newWFData.store();
			return newWFData;
		}
		return this;
	}

	/**
	 * Set one of WorkflowItem's title by its id, 
	 * This will also clone the list to trigger stateChange!
	 *
	 * If id is invalid the current list will be returns.
	 */
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

	/**
	 * Set one of WorkflowItem's done status by its id, 
	 * This will also clone the list to trigger stateChange!
	 *
	 * If id is invalid the current list will be returns.
	 */
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

	/**
	 * Make a hierarchy tree of current list items and returns the tree,
	 * Also this will update this.tree and this._mappedWFs to use later in 
	 * nextRef, previousRef and previousID.
	 */
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
		//Sort children via order prop!
		dataTree.forEach(twfItem => {
			if(twfItem.children && twfItem.children.length > 0){
				twfItem.children = sortChildren(twfItem.children); 
			}
		});
		this.tree = dataTree;
		this._mappedWFs = mappedWFItems;
		return dataTree;
	}
}

export {WorkflowItem, WorkflowData};
