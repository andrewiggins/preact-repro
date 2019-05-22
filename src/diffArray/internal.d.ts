export interface VNode {
	type: string | Function | null;
	props: any;
	key: any;
	_children?: VNode[];
	_dom?: Node;
	_oldIndex?: number;
	_newIndex?: number;
}
