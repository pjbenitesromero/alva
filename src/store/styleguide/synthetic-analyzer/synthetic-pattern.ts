import { Pattern } from '../../pattern/pattern';
import { PatternIdentifier } from '../../pattern/pattern-identifier';
import { Property } from '../../pattern/property/property';

export class SyntheticPattern extends Pattern {
	public id: PatternIdentifier;
	public iconPath?: string | undefined;
	public name: string;
	public readonly properties: Map<string, Property> = new Map();
	public readonly valid: boolean = true;

	public constructor() {
		super();
	}

	public toString(): string {
		throw new Error('Method not implemented.');
	}

	public reload(): void {
		// stub. do nothing.
	}
}
