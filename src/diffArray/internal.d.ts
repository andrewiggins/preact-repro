export interface VNode {
	type: string | Function | null;
	props: any;
	key: any;
	_children?: VNode[];
	_dom?: Node;

	// For preact
	_lastDomChild: Node;

	// For backward and forward loop
	_oldIndex?: number;
	_newIndex?: number;
}
