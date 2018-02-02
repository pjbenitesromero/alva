import { Styleguide } from './styleguide';
import { SyntheticAnalyzer } from './synthetic-analyzer';

export class SyntheticStyleguide extends Styleguide {
	public constructor() {
		super('synthetic', '', []);

		this.analyzers.push(new SyntheticAnalyzer(this));
	}
}
