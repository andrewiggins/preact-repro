export interface VNode {
	key: any;
	_children?: VNode[];
	_dom?: Node;
	_oldIndex?: number;
	_newIndex?: number;
}
